import { NotFoundException } from '@nestjs/common';
import { Service } from '../../services/domain/service.entity';
import { FindServiceUseCase } from '../../services/application/find.service.usecase';
import { AgendaValidationError, BusinessHours } from '../domain/agenda.rules';
import { IAgendaRepository } from '../domain/agenda.repository.interface';
import { FindAvailabilityUseCase } from './find-availability.usecase';

describe('FindAvailabilityUseCase', () => {
  const closed: BusinessHours[] = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isOpen: false,
    openTime: null,
    closeTime: null,
    lunchStart: null,
    lunchEnd: null,
  }));
  const hours: BusinessHours[] = closed.map((day) =>
    day.dayOfWeek === 3
      ? {
          dayOfWeek: 3,
          isOpen: true,
          openTime: '09:00',
          closeTime: '12:00',
          lunchStart: '10:00',
          lunchEnd: '11:00',
        }
      : day,
  );
  const service = new Service({
    name: 'Manicure',
    category: 'Mãos',
    priceCents: 4500,
    durationMinutes: 60,
  });
  const repository = {
    listBusinessHours: jest.fn().mockResolvedValue(hours),
    listBlocks: jest
      .fn()
      .mockResolvedValue([
        { date: '2026-10-07', startTime: '11:00', endTime: '11:30' },
      ]),
    listOccupied: jest.fn().mockResolvedValue([]),
  } as unknown as IAgendaRepository;
  const findService = {
    execute: jest.fn().mockResolvedValue(service),
  } as unknown as FindServiceUseCase;
  const useCase = new FindAvailabilityUseCase(repository, findService);

  it('respeita duração, pausa, bloqueio e dias fechados', async () => {
    const slots = await useCase.execute(
      service.id,
      '2026-10-07',
      '2026-10-08',
      new Date('2026-10-01T12:00:00Z'),
    );
    expect(slots).toEqual([
      { date: '2026-10-07', startTime: '09:00', endTime: '10:00' },
    ]);
  });

  it('não oferece horários que já passaram no fuso de São Paulo', async () => {
    const slots = await useCase.execute(
      service.id,
      '2026-10-07',
      '2026-10-07',
      new Date('2026-10-07T12:00:00Z'),
    );
    expect(slots).toEqual([]);
  });

  it('rejeita datas impossíveis e intervalos maiores que 31 dias', async () => {
    await expect(
      useCase.execute(service.id, '2026-02-30', '2026-03-01'),
    ).rejects.toThrow(AgendaValidationError);
    await expect(
      useCase.execute(service.id, '2026-10-01', '2026-11-01'),
    ).rejects.toThrow(AgendaValidationError);
  });

  it('não oferece um serviço inativo', async () => {
    const inactive = new Service({
      name: 'Manicure',
      category: 'Mãos',
      priceCents: 4500,
      durationMinutes: 60,
      active: false,
    });
    const finder = {
      execute: jest.fn().mockResolvedValue(inactive),
    } as unknown as FindServiceUseCase;
    await expect(
      new FindAvailabilityUseCase(repository, finder).execute(
        inactive.id,
        '2026-10-07',
        '2026-10-07',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('desconta agendamentos que ocupam o horário', async () => {
    const occupied = {
      ...repository,
      listOccupied: jest
        .fn()
        .mockResolvedValue([
          { date: '2026-10-07', startTime: '09:00', endTime: '10:00' },
        ]),
    } as IAgendaRepository;
    const slots = await new FindAvailabilityUseCase(
      occupied,
      findService,
    ).execute(
      service.id,
      '2026-10-07',
      '2026-10-07',
      new Date('2026-10-01T12:00:00Z'),
    );
    expect(slots).toEqual([]);
  });
});
