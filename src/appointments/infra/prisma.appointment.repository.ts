import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import {
  Appointment,
  AppointmentConflictError,
  AppointmentStatus,
  AppointmentStatusEvent,
} from '../domain/appointment.entity';
import { IAppointmentRepository } from '../domain/appointment.repository.interface';

@Injectable()
export class PrismaAppointmentRepository implements IAppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    appointment: Appointment,
    actorId: string,
  ): Promise<Appointment> {
    try {
      await this.prisma.appointmentModel.create({
        data: {
          id: appointment.id,
          clientId: appointment.clientId,
          serviceId: appointment.serviceId,
          requestedDate: this.date(appointment.requestedDate),
          requestedTime: appointment.requestedTime,
          endTime: appointment.endTime,
          startAt: this.localTimestamp(
            appointment.requestedDate,
            appointment.requestedTime,
          ),
          endAt: this.localTimestamp(
            appointment.requestedDate,
            appointment.endTime,
          ),
          durationMinutes: appointment.durationMinutes,
          priceCents: appointment.priceCents,
          source: appointment.source,
          status: appointment.status,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
          history: {
            create: {
              fromStatus: null,
              toStatus: 'AGUARDANDO',
              actorType: appointment.source === 'MANUAL' ? 'MANICURE' : 'BOT',
              actorId,
            },
          },
        },
      });
    } catch (error) {
      if (this.isOverlap(error))
        throw new AppointmentConflictError('Horário já ocupado');
      throw error;
    }
    return appointment;
  }

  async findById(id: string): Promise<Appointment | null> {
    const record = await this.prisma.appointmentModel.findUnique({
      where: { id },
    });
    return record ? this.map(record) : null;
  }

  async list(
    from: string,
    to: string,
    status?: AppointmentStatus,
  ): Promise<Appointment[]> {
    const records = await this.prisma.appointmentModel.findMany({
      where: {
        requestedDate: { gte: this.date(from), lte: this.date(to) },
        ...(status ? { status } : {}),
      },
      orderBy: [{ requestedDate: 'asc' }, { requestedTime: 'asc' }],
    });
    return records.map((record) => this.map(record));
  }

  async listPending(): Promise<Appointment[]> {
    const records = await this.prisma.appointmentModel.findMany({
      where: { status: 'AGUARDANDO' },
      orderBy: [{ requestedDate: 'asc' }, { requestedTime: 'asc' }],
      take: 100,
    });
    return records.map((record) => this.map(record));
  }

  async transition(
    current: Appointment,
    next: Appointment,
    actorId: string,
  ): Promise<Appointment> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.appointmentModel.updateMany({
          where: { id: current.id, status: current.status },
          data: {
            status: next.status,
            denialReason: next.denialReason,
            proposedDate: next.proposedDate
              ? this.date(next.proposedDate)
              : null,
            proposedTime: next.proposedTime,
            updatedAt: next.updatedAt,
          },
        });
        if (updated.count !== 1)
          throw new AppointmentConflictError('O pedido já foi decidido');
        await tx.appointmentStatusEventModel.create({
          data: {
            appointmentId: current.id,
            fromStatus: current.status,
            toStatus: next.status,
            actorType: 'MANICURE',
            actorId,
            reason: next.denialReason,
            proposedDate: next.proposedDate
              ? this.date(next.proposedDate)
              : null,
            proposedTime: next.proposedTime,
          },
        });
        await tx.automationEventModel.create({
          data: {
            type: 'appointment.status_changed',
            aggregateId: next.id,
            payload: {
              appointmentId: next.id,
              clientId: next.clientId,
              serviceId: next.serviceId,
              status: next.status,
              requestedDate: next.requestedDate,
              requestedTime: next.requestedTime,
              proposedDate: next.proposedDate,
              proposedTime: next.proposedTime,
              denialReason: next.denialReason,
            },
          },
        });
      });
    } catch (error) {
      if (this.isOverlap(error))
        throw new AppointmentConflictError('Horário já ocupado');
      throw error;
    }
    return next;
  }

  async reschedule(current: Appointment, next: Appointment, actorId: string): Promise<Appointment> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.appointmentModel.updateMany({
          where: { id: current.id, status: 'CONFIRMADO' },
          data: {
            requestedDate: this.date(next.requestedDate),
            requestedTime: next.requestedTime,
            endTime: next.endTime,
            startAt: this.localTimestamp(next.requestedDate, next.requestedTime),
            endAt: this.localTimestamp(next.requestedDate, next.endTime),
            updatedAt: next.updatedAt,
          },
        });
        if (updated.count !== 1) throw new AppointmentConflictError('O agendamento foi alterado por outra operação');
        await tx.appointmentStatusEventModel.create({
          data: {
            appointmentId: current.id,
            fromStatus: 'CONFIRMADO',
            toStatus: 'CONFIRMADO',
            actorType: 'MANICURE',
            actorId,
            reason: `Reagendado de ${current.requestedDate} ${current.requestedTime}`,
            proposedDate: this.date(next.requestedDate),
            proposedTime: next.requestedTime,
          },
        });
        await tx.automationEventModel.create({
          data: {
            type: 'appointment.rescheduled',
            aggregateId: next.id,
            payload: { appointmentId: next.id, oldDate: current.requestedDate, oldTime: current.requestedTime, requestedDate: next.requestedDate, requestedTime: next.requestedTime },
          },
        });
      });
    } catch (error) {
      if (this.isOverlap(error)) throw new AppointmentConflictError('Horário já ocupado');
      throw error;
    }
    return next;
  }

  async history(id: string): Promise<AppointmentStatusEvent[]> {
    const records = await this.prisma.appointmentStatusEventModel.findMany({
      where: { appointmentId: id },
      orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
    });
    return records.map((record) => ({
      id: record.id,
      appointmentId: record.appointmentId,
      fromStatus: record.fromStatus as AppointmentStatus | null,
      toStatus: record.toStatus as AppointmentStatus,
      actorType: record.actorType as 'MANICURE' | 'BOT',
      actorId: record.actorId,
      reason: record.reason,
      proposedDate: record.proposedDate?.toISOString().slice(0, 10) ?? null,
      proposedTime: record.proposedTime,
      occurredAt: record.occurredAt,
    }));
  }

  private date(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private localTimestamp(date: string, time: string): Date {
    return new Date(`${date}T${time}:00.000Z`);
  }

  private map(record: {
    id: string;
    clientId: string;
    serviceId: string;
    requestedDate: Date;
    requestedTime: string;
    durationMinutes: number;
    priceCents: number;
    source: string;
    status: string;
    denialReason: string | null;
    proposedDate: Date | null;
    proposedTime: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Appointment {
    return new Appointment({
      id: record.id,
      clientId: record.clientId,
      serviceId: record.serviceId,
      requestedDate: record.requestedDate.toISOString().slice(0, 10),
      requestedTime: record.requestedTime,
      durationMinutes: record.durationMinutes,
      priceCents: record.priceCents,
      source: record.source as Appointment['source'],
      status: record.status as AppointmentStatus,
      denialReason: record.denialReason,
      proposedDate: record.proposedDate?.toISOString().slice(0, 10),
      proposedTime: record.proposedTime,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  private isOverlap(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false;
    const value = error as {
      code?: unknown;
      message?: unknown;
      meta?: unknown;
      cause?: unknown;
    };
    if (value.code === '23P01') return true;
    if (
      value.code === 'P2004' &&
      JSON.stringify(value.meta ?? {}).includes('agendamentos_no_overlap')
    )
      return true;
    if (String(value.message).includes('agendamentos_no_overlap')) return true;
    return value.cause ? this.isOverlap(value.cause) : false;
  }
}
