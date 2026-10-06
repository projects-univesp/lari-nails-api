import {
  Appointment,
  AppointmentConflictError,
  AppointmentValidationError,
} from './appointment.entity';

describe('Appointment Entity', () => {
  const input = {
    clientId: '44770bdb-780c-4c83-baa1-7b8de046fa98',
    serviceId: '38088ad1-a26b-4b20-a004-43ff9c442379',
    requestedDate: '2026-10-07',
    requestedTime: '09:00',
    durationMinutes: 60,
    priceCents: 4500,
    source: 'MANUAL' as const,
  };

  it('cria pedido aguardando com fim calculado pela duração', () => {
    const appointment = new Appointment(input);
    expect(appointment.status).toBe('AGUARDANDO');
    expect(appointment.endTime).toBe('10:00');
    expect(appointment.priceCents).toBe(4500);
  });

  it('exige motivo para recusa e impede uma segunda decisão', () => {
    const appointment = new Appointment(input);
    expect(() => appointment.decide('CANCELADO')).toThrow(
      AppointmentValidationError,
    );
    const denied = appointment.decide('CANCELADO', 'Sem expediente');
    expect(denied.denialReason).toBe('Sem expediente');
    expect(() => denied.decide('CONFIRMADO')).toThrow(AppointmentConflictError);
  });

  it('registra proposta sem alterar o horário original', () => {
    const appointment = new Appointment(input);
    const suggested = appointment.decide(
      'REAGENDAMENTO_SUGERIDO',
      undefined,
      '2026-10-08',
      '11:00',
    );
    expect(suggested.status).toBe('REAGENDAMENTO_SUGERIDO');
    expect(suggested.requestedTime).toBe('09:00');
    expect(suggested.proposedTime).toBe('11:00');
  });
});
