import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../infra/database/prisma.service';

export type CheckoutInput = { amountCents: number; status: 'PENDENTE' | 'RECEBIDO'; method?: 'PIX' | 'CARTAO' | 'DINHEIRO' };

@Injectable()
export class FinanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(appointmentId: string, input: CheckoutInput, actorId: string) {
    if (input.status === 'RECEBIDO' && !input.method) throw new ConflictException('Informe a forma de pagamento');
    const paidAt = input.status === 'RECEBIDO' ? new Date() : null;
    const paymentId = randomUUID();
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.appointmentModel.findUnique({ where: { id: appointmentId } });
      if (!current) throw new NotFoundException('Agendamento não encontrado');
      if (current.status !== 'CONFIRMADO') throw new ConflictException('Somente atendimentos confirmados podem ser concluídos');
      const updated = await tx.appointmentModel.updateMany({ where: { id: appointmentId, status: 'CONFIRMADO' }, data: { status: 'CONCLUIDO', updatedAt: new Date() } });
      if (updated.count !== 1) throw new ConflictException('O atendimento já foi concluído ou alterado');
      await tx.paymentModel.create({ data: { id: paymentId, appointmentId, amountCents: input.amountCents, status: input.status, method: input.status === 'RECEBIDO' ? input.method : null, paidAt } });
      await tx.appointmentStatusEventModel.create({ data: { appointmentId, fromStatus: 'CONFIRMADO', toStatus: 'CONCLUIDO', actorType: 'MANICURE', actorId } });
      await tx.automationEventModel.create({ data: { type: 'appointment.completed', aggregateId: appointmentId, payload: { appointmentId, paymentId, amountCents: input.amountCents, paymentStatus: input.status, method: input.method ?? null } } });
    });
    const record = await this.prisma.paymentModel.findUnique({ where: { id: paymentId }, include: { appointment: { include: { client: true, service: true } } } });
    return this.map(record!);
  }

  async list(from: string, to: string) {
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start.toISOString().slice(0, 10) !== from || end.toISOString().slice(0, 10) !== to) {
      throw new ConflictException('Informe datas válidas no formato YYYY-MM-DD');
    }
    end.setUTCDate(end.getUTCDate() + 1);
    const days = (end.getTime() - start.getTime()) / 86400000;
    if (days < 1 || days > 366) throw new ConflictException('Consulte um período de 1 a 366 dias');
    const records = await this.prisma.paymentModel.findMany({
      where: { OR: [{ status: 'RECEBIDO', paidAt: { gte: start, lt: end } }, { status: 'PENDENTE', createdAt: { gte: start, lt: end } }] },
      include: { appointment: { include: { client: true, service: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => this.map(record));
  }

  async receive(id: string, method: 'PIX' | 'CARTAO' | 'DINHEIRO') {
    const updated = await this.prisma.paymentModel.updateMany({ where: { id, status: 'PENDENTE' }, data: { status: 'RECEBIDO', method, paidAt: new Date(), updatedAt: new Date() } });
    if (updated.count !== 1) {
      const existing = await this.prisma.paymentModel.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Lançamento financeiro não encontrado');
      throw new ConflictException('Este pagamento já foi recebido');
    }
    const record = await this.prisma.paymentModel.findUnique({ where: { id }, include: { appointment: { include: { client: true, service: true } } } });
    return this.map(record!);
  }

  private map(record: Prisma.PaymentModelGetPayload<{ include: { appointment: { include: { client: true; service: true } } } }>) {
    const { appointment, ...payment } = record;
    return {
      id: payment.id,
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      clientName: appointment.client.nome,
      serviceName: appointment.service.name,
      amountCents: payment.amountCents,
      status: payment.status,
      method: payment.method,
      appointmentDate: appointment.requestedDate.toISOString().slice(0, 10),
      appointmentTime: appointment.requestedTime,
      date: (payment.paidAt ?? payment.createdAt).toISOString(),
      paidAt: payment.paidAt?.toISOString() ?? null,
    };
  }
}
