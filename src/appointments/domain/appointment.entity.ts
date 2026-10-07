import { randomUUID } from 'crypto';
import {
  assertDate,
  minuteOfDay,
  timeFromMinute,
} from '../../agenda/domain/agenda.rules';

export type AppointmentStatus =
  'AGUARDANDO' | 'CONFIRMADO' | 'REAGENDAMENTO_SUGERIDO' | 'CANCELADO' | 'CONCLUIDO';
export type AppointmentSource = 'MANUAL' | 'WHATSAPP_BOT';
export type AppointmentDecision = Exclude<AppointmentStatus, 'AGUARDANDO' | 'CONCLUIDO'>;

export class AppointmentValidationError extends Error {}
export class AppointmentConflictError extends Error {}

export interface AppointmentData {
  id?: string;
  clientId: string;
  serviceId: string;
  requestedDate: string;
  requestedTime: string;
  durationMinutes: number;
  priceCents: number;
  source: AppointmentSource;
  status?: AppointmentStatus;
  denialReason?: string | null;
  proposedDate?: string | null;
  proposedTime?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AppointmentStatusEvent {
  id: string;
  appointmentId: string;
  fromStatus: AppointmentStatus | null;
  toStatus: AppointmentStatus;
  actorType: 'MANICURE' | 'BOT';
  actorId: string | null;
  reason: string | null;
  proposedDate: string | null;
  proposedTime: string | null;
  occurredAt: Date;
}

export class Appointment {
  readonly id: string;
  readonly clientId: string;
  readonly serviceId: string;
  readonly requestedDate: string;
  readonly requestedTime: string;
  readonly endTime: string;
  readonly durationMinutes: number;
  readonly priceCents: number;
  readonly source: AppointmentSource;
  readonly status: AppointmentStatus;
  readonly denialReason: string | null;
  readonly proposedDate: string | null;
  readonly proposedTime: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: AppointmentData) {
    this.id = data.id ?? randomUUID();
    this.clientId = data.clientId;
    this.serviceId = data.serviceId;
    this.requestedDate = data.requestedDate;
    this.requestedTime = data.requestedTime;
    this.durationMinutes = data.durationMinutes;
    this.priceCents = data.priceCents;
    this.source = data.source;
    this.status = data.status ?? 'AGUARDANDO';
    this.denialReason = data.denialReason ?? null;
    this.proposedDate = data.proposedDate ?? null;
    this.proposedTime = data.proposedTime ?? null;
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
    this.validate();
    this.endTime = timeFromMinute(
      minuteOfDay(this.requestedTime) + this.durationMinutes,
    );
  }

  decide(
    status: AppointmentDecision,
    reason?: string,
    proposedDate?: string,
    proposedTime?: string,
  ): Appointment {
    if (this.status !== 'AGUARDANDO' && !(status === 'CANCELADO' && this.status === 'CONFIRMADO')) {
      throw new AppointmentConflictError('O pedido já foi decidido');
    }
    if (status === 'CANCELADO' && (!reason?.trim() || reason.length > 500)) {
      throw new AppointmentValidationError('Informe o motivo da recusa');
    }
    if (status === 'REAGENDAMENTO_SUGERIDO') {
      if (!proposedDate || !proposedTime)
        throw new AppointmentValidationError(
          'Informe a data e o horário sugeridos',
        );
      assertDate(proposedDate);
      minuteOfDay(proposedTime);
    }
    return new Appointment({
      ...this,
      status,
      denialReason: status === 'CANCELADO' ? reason!.trim() : null,
      proposedDate: status === 'REAGENDAMENTO_SUGERIDO' ? proposedDate : null,
      proposedTime: status === 'REAGENDAMENTO_SUGERIDO' ? proposedTime : null,
      updatedAt: new Date(),
    });
  }

  reschedule(requestedDate: string, requestedTime: string): Appointment {
    if (this.status !== 'CONFIRMADO') {
      throw new AppointmentConflictError('Somente agendamentos confirmados podem ser alterados');
    }
    assertDate(requestedDate);
    minuteOfDay(requestedTime);
    return new Appointment({
      ...this,
      requestedDate,
      requestedTime,
      updatedAt: new Date(),
    });
  }

  complete(): Appointment {
    if (this.status !== 'CONFIRMADO') {
      throw new AppointmentConflictError('Somente atendimentos confirmados podem ser concluídos');
    }
    return new Appointment({ ...this, status: 'CONCLUIDO', updatedAt: new Date() });
  }

  private validate(): void {
    for (const id of [this.id, this.clientId, this.serviceId]) {
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        )
      ) {
        throw new AppointmentValidationError('ID inválido');
      }
    }
    assertDate(this.requestedDate);
    const start = minuteOfDay(this.requestedTime);
    if (
      !Number.isInteger(this.durationMinutes) ||
      this.durationMinutes < 1 ||
      start + this.durationMinutes > 1439
    ) {
      throw new AppointmentValidationError('Duração ou horário inválido');
    }
    if (!Number.isInteger(this.priceCents) || this.priceCents < 0) {
      throw new AppointmentValidationError('Preço inválido');
    }
    if (
      !['MANUAL', 'WHATSAPP_BOT'].includes(this.source) ||
      ![
        'AGUARDANDO',
        'CONFIRMADO',
        'REAGENDAMENTO_SUGERIDO',
        'CANCELADO',
        'CONCLUIDO',
      ].includes(this.status)
    ) {
      throw new AppointmentValidationError('Origem ou estado inválido');
    }
  }
}
