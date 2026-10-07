import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/database/prisma.service';
import {
  FinanceConflictError,
  FinanceNotFoundError,
} from '../domain/finance.errors';
import {
  FinanceTransaction,
  IFinanceRepository,
} from '../domain/finance.repository.interface';
import { Payment, PaymentMethod } from '../domain/payment.entity';

type PaymentWithRelations = Prisma.PaymentModelGetPayload<{
  include: { appointment: { include: { client: true; service: true } } };
}>;

@Injectable()
export class PrismaFinanceRepository implements IFinanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async registerCheckout(
    payment: Payment,
    actorId: string,
  ): Promise<FinanceTransaction> {
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.appointmentModel.findUnique({
        where: { id: payment.appointmentId },
      });
      if (!current) {
        throw new FinanceNotFoundError('Agendamento não encontrado');
      }
      if (current.status !== 'CONFIRMADO') {
        throw new FinanceConflictError(
          'Somente atendimentos confirmados podem ser concluídos',
        );
      }

      const updated = await tx.appointmentModel.updateMany({
        where: { id: payment.appointmentId, status: 'CONFIRMADO' },
        data: { status: 'CONCLUIDO', updatedAt: new Date() },
      });
      if (updated.count !== 1) {
        throw new FinanceConflictError(
          'O atendimento já foi concluído ou alterado',
        );
      }

      await tx.paymentModel.create({
        data: {
          id: payment.id,
          appointmentId: payment.appointmentId,
          amountCents: payment.amountCents,
          status: payment.status,
          method: payment.method,
          paidAt: payment.paidAt,
        },
      });

      await tx.appointmentStatusEventModel.create({
        data: {
          appointmentId: payment.appointmentId,
          fromStatus: 'CONFIRMADO',
          toStatus: 'CONCLUIDO',
          actorType: 'MANICURE',
          actorId,
        },
      });

      await tx.automationEventModel.create({
        data: {
          type: 'appointment.completed',
          aggregateId: payment.appointmentId,
          payload: {
            appointmentId: payment.appointmentId,
            paymentId: payment.id,
            amountCents: payment.amountCents,
            paymentStatus: payment.status,
            method: payment.method,
          },
        },
      });
    });

    const record = await this.prisma.paymentModel.findUnique({
      where: { id: payment.id },
      include: { appointment: { include: { client: true, service: true } } },
    });
    return this.toTransaction(record!);
  }

  async listByPeriod(start: Date, end: Date): Promise<FinanceTransaction[]> {
    const records = await this.prisma.paymentModel.findMany({
      where: {
        OR: [
          { status: 'RECEBIDO', paidAt: { gte: start, lt: end } },
          { status: 'PENDENTE', createdAt: { gte: start, lt: end } },
        ],
      },
      include: { appointment: { include: { client: true, service: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => this.toTransaction(record));
  }

  async markAsReceived(
    id: string,
    method: PaymentMethod,
  ): Promise<FinanceTransaction> {
    const updated = await this.prisma.paymentModel.updateMany({
      where: { id, status: 'PENDENTE' },
      data: {
        status: 'RECEBIDO',
        method,
        paidAt: new Date(),
        updatedAt: new Date(),
      },
    });
    if (updated.count !== 1) {
      const existing = await this.prisma.paymentModel.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new FinanceNotFoundError('Lançamento financeiro não encontrado');
      }
      throw new FinanceConflictError('Este pagamento já foi recebido');
    }

    const record = await this.prisma.paymentModel.findUnique({
      where: { id },
      include: { appointment: { include: { client: true, service: true } } },
    });
    return this.toTransaction(record!);
  }

  private toTransaction(record: PaymentWithRelations): FinanceTransaction {
    const { appointment, ...payment } = record;
    return {
      id: payment.id,
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      clientName: appointment.client.nome,
      serviceName: appointment.service.name,
      amountCents: payment.amountCents,
      status: payment.status as FinanceTransaction['status'],
      method: payment.method as FinanceTransaction['method'],
      appointmentDate: appointment.requestedDate.toISOString().slice(0, 10),
      appointmentTime: appointment.requestedTime,
      date: (payment.paidAt ?? payment.createdAt).toISOString(),
      paidAt: payment.paidAt?.toISOString() ?? null,
    };
  }
}
