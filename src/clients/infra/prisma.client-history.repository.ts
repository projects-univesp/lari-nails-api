import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import type { ClientHistoryRecord, IClientHistoryRepository } from '../domain/client-history.repository.interface';

@Injectable()
export class PrismaClientHistoryRepository implements IClientHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async history(clientId: string): Promise<ClientHistoryRecord[]> {
    const records = await this.prisma.appointmentModel.findMany({
      where: { clientId, status: 'CONCLUIDO', payment: { isNot: null } },
      include: { service: true, payment: true },
      orderBy: [{ requestedDate: 'desc' }, { requestedTime: 'desc' }],
      take: 200,
    });
    return records.flatMap((record) => record.payment ? [{
      id: record.id,
      date: record.requestedDate.toISOString().slice(0, 10),
      time: record.requestedTime,
      status: record.status,
      service: record.service.name,
      amountCents: record.payment.amountCents,
      paymentStatus: record.payment.status as 'PENDENTE' | 'RECEBIDO',
      paymentMethod: record.payment.method as ClientHistoryRecord['paymentMethod'],
      paymentId: record.payment.id,
    }] : []);
  }
}
