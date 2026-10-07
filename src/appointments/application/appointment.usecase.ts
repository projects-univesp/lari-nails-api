import { ConflictException, NotFoundException } from '@nestjs/common';
import { FindAvailabilityUseCase } from '../../agenda/application/find-availability.usecase';
import {
  AgendaValidationError,
  assertDate,
  minuteOfDay,
} from '../../agenda/domain/agenda.rules';
import { FindClientUseCase } from '../../clients/application/find.client.usecase';
import { FindCatalogItemUseCase } from '../../catalog/application/find.catalog-item.usecase';
import {
  Appointment,
  AppointmentDecision,
  AppointmentSource,
  AppointmentStatus,
  AppointmentStatusEvent,
} from '../domain/appointment.entity';
import { IAppointmentRepository } from '../domain/appointment.repository.interface';

export class AppointmentUseCase {
  constructor(
    private readonly repository: IAppointmentRepository,
    private readonly findClient: FindClientUseCase,
    private readonly findService: FindCatalogItemUseCase,
    private readonly availability: FindAvailabilityUseCase,
  ) {}

  async create(
    input: {
      clientId: string;
      serviceId: string;
      requestedDate: string;
      requestedTime: string;
      source: AppointmentSource;
    },
    actorId: string,
  ): Promise<Appointment> {
    const client = await this.findClient.execute(input.clientId);
    if (!client) throw new NotFoundException('Cliente não encontrado');
    const service = await this.findService.execute(input.serviceId);
    if (!service.active) throw new NotFoundException('Serviço indisponível');
    const appointment = new Appointment({
      ...input,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
    });
    await this.requireSlot(
      input.serviceId,
      input.requestedDate,
      input.requestedTime,
    );
    return this.repository.create(appointment, actorId);
  }

  async find(id: string): Promise<Appointment> {
    const appointment = await this.repository.findById(id);
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    return appointment;
  }

  list(
    from: string,
    to: string,
    status?: AppointmentStatus,
  ): Promise<Appointment[]> {
    assertDate(from);
    assertDate(to);
    if (from > to)
      throw new AgendaValidationError('O início deve ocorrer antes do fim');
    const days =
      (new Date(`${to}T00:00:00Z`).getTime() -
        new Date(`${from}T00:00:00Z`).getTime()) /
        86400000 +
      1;
    if (days > 31)
      throw new AgendaValidationError('Consulte um intervalo de 1 a 31 dias');
    return this.repository.list(from, to, status);
  }

  listPending(): Promise<Appointment[]> {
    return this.repository.listPending();
  }

  async decide(
    id: string,
    input: {
      status: AppointmentDecision;
      reason?: string;
      proposedDate?: string;
      proposedTime?: string;
    },
    actorId: string,
  ): Promise<Appointment> {
    const current = await this.find(id);
    const next = current.decide(
      input.status,
      input.reason,
      input.proposedDate,
      input.proposedTime,
    );
    if (input.status === 'REAGENDAMENTO_SUGERIDO') {
      await this.requireSlot(
        current.serviceId,
        next.proposedDate!,
        next.proposedTime!,
      );
    }
    return this.repository.transition(current, next, actorId);
  }

  async reschedule(id: string, requestedDate: string, requestedTime: string, actorId: string): Promise<Appointment> {
    const current = await this.find(id);
    const next = current.reschedule(requestedDate, requestedTime);
    const slots = await this.availability.execute(current.serviceId, requestedDate, requestedDate, new Date(), id);
    if (!slots.some((slot) => slot.startTime === requestedTime)) {
      throw new ConflictException('Horário indisponível');
    }
    return this.repository.reschedule(current, next, actorId);
  }

  async history(id: string): Promise<AppointmentStatusEvent[]> {
    await this.find(id);
    return this.repository.history(id);
  }

  private async requireSlot(
    serviceId: string,
    date: string,
    time: string,
  ): Promise<void> {
    minuteOfDay(time);
    const slots = await this.availability.execute(serviceId, date, date);
    if (!slots.some((slot) => slot.startTime === time)) {
      throw new ConflictException('Horário indisponível');
    }
  }
}
