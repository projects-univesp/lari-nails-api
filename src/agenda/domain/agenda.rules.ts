export class AgendaValidationError extends Error {}

export interface BusinessHours {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  lunchStart: string | null;
  lunchEnd: string | null;
}

export interface AgendaBlock {
  id: string;
  reason: string;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgendaBlockInput {
  reason: string;
  date: string;
  startTime: string;
  endTime: string;
}

export function minuteOfDay(time: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new AgendaValidationError('Horário inválido; use HH:mm');
  }
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export function timeFromMinute(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
}

export function assertDate(date: string): void {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new AgendaValidationError('Data inválida; use YYYY-MM-DD');
  }
}

export function validateBusinessHours(hours: BusinessHours[]): void {
  if (
    hours.length !== 7 ||
    new Set(hours.map((day) => day.dayOfWeek)).size !== 7
  ) {
    throw new AgendaValidationError(
      'Informe os sete dias da semana uma única vez',
    );
  }
  for (const day of hours) {
    if (
      !Number.isInteger(day.dayOfWeek) ||
      day.dayOfWeek < 0 ||
      day.dayOfWeek > 6 ||
      typeof day.isOpen !== 'boolean'
    ) {
      throw new AgendaValidationError('Dia da semana inválido');
    }
    for (const time of [
      day.openTime,
      day.closeTime,
      day.lunchStart,
      day.lunchEnd,
    ]) {
      if (time !== null) minuteOfDay(time);
    }
    if (!day.isOpen) continue;
    if (day.openTime === null || day.closeTime === null) {
      throw new AgendaValidationError(
        'Dia aberto exige horário de início e término',
      );
    }
    const open = minuteOfDay(day.openTime);
    const close = minuteOfDay(day.closeTime);
    if (open >= close)
      throw new AgendaValidationError(
        'O fechamento deve ocorrer após a abertura',
      );
    if ((day.lunchStart === null) !== (day.lunchEnd === null)) {
      throw new AgendaValidationError('Informe início e fim da pausa');
    }
    if (day.lunchStart !== null && day.lunchEnd !== null) {
      const start = minuteOfDay(day.lunchStart);
      const end = minuteOfDay(day.lunchEnd);
      if (start < open || end > close || start >= end) {
        throw new AgendaValidationError(
          'A pausa deve ficar dentro do expediente',
        );
      }
    }
  }
}

export function validateAgendaBlock(block: AgendaBlockInput): void {
  assertDate(block.date);
  if (
    typeof block.reason !== 'string' ||
    !block.reason.trim() ||
    block.reason.length > 120
  ) {
    throw new AgendaValidationError('Motivo do bloqueio inválido');
  }
  if (minuteOfDay(block.startTime) >= minuteOfDay(block.endTime)) {
    throw new AgendaValidationError(
      'O fim do bloqueio deve ocorrer após o início',
    );
  }
}
