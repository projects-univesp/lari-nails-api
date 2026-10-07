import { ConflictException, NotFoundException } from '@nestjs/common';
import { FindAvailabilityUseCase } from '../../agenda/application/find-availability.usecase';
import { FindClientUseCase } from '../../clients/application/find.client.usecase';
import { Client } from '../../clients/domain/client.entity';
import { FindCatalogItemUseCase } from '../../catalog/application/find.catalog-item.usecase';
import { CatalogItem } from '../../catalog/domain/catalog-item.entity';
import {
  Appointment,
  AppointmentConflictError,
} from '../domain/appointment.entity';
import { IAppointmentRepository } from '../domain/appointment.repository.interface';
import { AppointmentUseCase } from './appointment.usecase';

describe('AppointmentUseCase', () => {
  const client = new Client('Maria', '11999999999');
  const service = new CatalogItem({
    name: 'Manicure',
    category: 'Mãos',
    priceCents: 4500,
    durationMinutes: 60,
  });
  let current: Appointment | null = null;
  const createMock = jest.fn((appointment: Appointment) => {
    current = appointment;
    return Promise.resolve(appointment);
  });
  const repository = {
    create: createMock,
    findById: jest.fn(() => Promise.resolve(current)),
    transition: jest.fn((_old: Appointment, next: Appointment) => {
      current = next;
      return Promise.resolve(next);
    }),
    history: jest.fn().mockResolvedValue([]),
  } as unknown as IAppointmentRepository;
  const findClient = {
    execute: jest.fn().mockResolvedValue(client),
  } as unknown as FindClientUseCase;
  const findService = {
    execute: jest.fn().mockResolvedValue(service),
  } as unknown as FindCatalogItemUseCase;
  const available = {
    execute: jest
      .fn()
      .mockResolvedValue([
        { date: '2099-10-07', startTime: '09:00', endTime: '10:00' },
      ]),
  } as unknown as FindAvailabilityUseCase;
  const useCase = new AppointmentUseCase(
    repository,
    findClient,
    findService,
    available,
  );
  const input = {
    clientId: client.getId(),
    serviceId: service.id,
    requestedDate: '2099-10-07',
    requestedTime: '09:00',
    source: 'MANUAL' as const,
  };

  beforeEach(() => {
    current = null;
    jest.clearAllMocks();
  });

  it('cria pedido aguardando para cliente, serviço e vaga válidos', async () => {
    const result = await useCase.create(
      input,
      'a56e973c-c5cd-4cf1-aac9-01c978c2295f',
    );
    expect(result.status).toBe('AGUARDANDO');
    expect(result.durationMinutes).toBe(60);
    expect(result.priceCents).toBe(4500);
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it('recusa horário ausente da disponibilidade', async () => {
    const unavailable = {
      execute: jest.fn().mockResolvedValue([]),
    } as unknown as FindAvailabilityUseCase;
    const action = new AppointmentUseCase(
      repository,
      findClient,
      findService,
      unavailable,
    );
    await expect(action.create(input, 'actor')).rejects.toThrow(
      ConflictException,
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  it('confirma e permite cancelar o agendamento confirmado uma vez', async () => {
    const created = await useCase.create(input, 'actor');
    const confirmed = await useCase.decide(
      created.id,
      { status: 'CONFIRMADO' },
      'actor',
    );
    expect(confirmed.status).toBe('CONFIRMADO');
    const cancelled = await useCase.decide(
      created.id,
      { status: 'CANCELADO', reason: 'Teste' },
      'actor',
    );
    expect(cancelled.status).toBe('CANCELADO');
    await expect(useCase.decide(created.id, { status: 'CANCELADO', reason: 'Teste' }, 'actor')).rejects.toThrow(AppointmentConflictError);
  });

  it('não cria pedido para cliente inexistente', async () => {
    const missing = {
      execute: jest.fn().mockResolvedValue(null),
    } as unknown as FindClientUseCase;
    const action = new AppointmentUseCase(
      repository,
      missing,
      findService,
      available,
    );
    await expect(action.create(input, 'actor')).rejects.toThrow(
      NotFoundException,
    );
  });
});
