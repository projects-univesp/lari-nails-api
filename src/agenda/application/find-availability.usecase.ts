import { NotFoundException } from '@nestjs/common';
import { FindServiceUseCase } from '../../services/application/find.service.usecase';
import {
  AgendaValidationError,
  assertDate,
  minuteOfDay,
  timeFromMinute,
} from '../domain/agenda.rules';
import { IAgendaRepository } from '../domain/agenda.repository.interface';

export interface AvailableSlot {
  date: string;
  startTime: string;
  endTime: string;
}

export class FindAvailabilityUseCase {
  constructor(
    private readonly repository: IAgendaRepository,
    private readonly findService: FindServiceUseCase,
  ) {}

  async execute(
    serviceId: string,
    from: string,
    to: string,
    now: Date = new Date(),
  ): Promise<AvailableSlot[]> {
    assertDate(from);
    assertDate(to);
    const startDate = new Date(`${from}T00:00:00.000Z`);
    const endDate = new Date(`${to}T00:00:00.000Z`);
    const dayCount =
      Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
    if (dayCount < 1 || dayCount > 31) {
      throw new AgendaValidationError('Consulte um intervalo de 1 a 31 dias');
    }

    const service = await this.findService.execute(serviceId);
    if (!service.active) throw new NotFoundException('Serviço indisponível');
    const [hours, blocks, occupied] = await Promise.all([
      this.repository.listBusinessHours(),
      this.repository.listBlocks(from, to),
      this.repository.listOccupied(from, to),
    ]);
    const localNow = this.localNow(now);
    const slots: AvailableSlot[] = [];

    for (let offset = 0; offset < dayCount; offset++) {
      const current = new Date(startDate.getTime() + offset * 86400000);
      const date = current.toISOString().slice(0, 10);
      const schedule = hours.find(
        (day) => day.dayOfWeek === current.getUTCDay(),
      );
      if (
        !schedule?.isOpen ||
        schedule.openTime === null ||
        schedule.closeTime === null ||
        date < localNow.date
      )
        continue;
      const open = minuteOfDay(schedule.openTime);
      const close = minuteOfDay(schedule.closeTime);
      const lunchStart =
        schedule.lunchStart === null ? null : minuteOfDay(schedule.lunchStart);
      const lunchEnd =
        schedule.lunchEnd === null ? null : minuteOfDay(schedule.lunchEnd);
      const dayBlocks = blocks
        .filter((block) => block.date === date)
        .map((block) => ({
          start: minuteOfDay(block.startTime),
          end: minuteOfDay(block.endTime),
        }));
      const dayOccupied = occupied
        .filter((slot) => slot.date === date)
        .map((slot) => ({
          start: minuteOfDay(slot.startTime),
          end: minuteOfDay(slot.endTime),
        }));

      for (
        let start = open;
        start + service.durationMinutes <= close;
        start += 30
      ) {
        const end = start + service.durationMinutes;
        if (date === localNow.date && start <= localNow.minute) continue;
        if (
          lunchStart !== null &&
          lunchEnd !== null &&
          start < lunchEnd &&
          end > lunchStart
        )
          continue;
        if (dayBlocks.some((block) => start < block.end && end > block.start))
          continue;
        if (dayOccupied.some((slot) => start < slot.end && end > slot.start))
          continue;
        slots.push({
          date,
          startTime: timeFromMinute(start),
          endTime: timeFromMinute(end),
        });
      }
    }
    return slots;
  }

  private localNow(now: Date): { date: string; minute: number } {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const part = (type: string) =>
      parts.find((item) => item.type === type)?.value ?? '';
    return {
      date: `${part('year')}-${part('month')}-${part('day')}`,
      minute: Number(part('hour')) * 60 + Number(part('minute')),
    };
  }
}
