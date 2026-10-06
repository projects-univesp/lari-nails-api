import {
  AgendaValidationError,
  validateAgendaBlock,
  validateBusinessHours,
  BusinessHours,
} from './agenda.rules';

describe('Agenda rules', () => {
  const closed: BusinessHours[] = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isOpen: false,
    openTime: null,
    closeTime: null,
    lunchStart: null,
    lunchEnd: null,
  }));

  it('exige sete dias distintos e uma pausa dentro do expediente', () => {
    expect(() => validateBusinessHours(closed)).not.toThrow();
    expect(() => validateBusinessHours(closed.slice(0, 6))).toThrow(
      AgendaValidationError,
    );
    const invalid = closed.map((day) =>
      day.dayOfWeek === 1
        ? {
            dayOfWeek: 1,
            isOpen: true,
            openTime: '09:00',
            closeTime: '18:00',
            lunchStart: '08:00',
            lunchEnd: '09:00',
          }
        : day,
    );
    expect(() => validateBusinessHours(invalid)).toThrow(
      'A pausa deve ficar dentro do expediente',
    );
  });

  it('exige data real e bloqueio com fim após início', () => {
    const valid = {
      reason: 'Férias',
      date: '2026-10-07',
      startTime: '09:00',
      endTime: '12:00',
    };
    expect(() => validateAgendaBlock(valid)).not.toThrow();
    expect(() => validateAgendaBlock({ ...valid, date: '2026-02-30' })).toThrow(
      AgendaValidationError,
    );
    expect(() => validateAgendaBlock({ ...valid, endTime: '09:00' })).toThrow(
      AgendaValidationError,
    );
  });
});
