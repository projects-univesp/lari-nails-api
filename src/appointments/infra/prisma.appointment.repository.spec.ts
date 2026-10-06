import { PrismaService } from '../../infra/database/prisma.service';
import {
  Appointment,
  AppointmentConflictError,
} from '../domain/appointment.entity';
import { PrismaAppointmentRepository } from './prisma.appointment.repository';

describe('PrismaAppointmentRepository', () => {
  const appointment = new Appointment({
    clientId: '44770bdb-780c-4c83-baa1-7b8de046fa98',
    serviceId: '38088ad1-a26b-4b20-a004-43ff9c442379',
    requestedDate: '2099-10-07',
    requestedTime: '09:00',
    durationMinutes: 60,
    priceCents: 4500,
    source: 'MANUAL',
  });

  it('grava o evento inicial junto com o pedido', async () => {
    const create = jest.fn((args: unknown) => Promise.resolve(args));
    const repository = new PrismaAppointmentRepository({
      appointmentModel: { create },
    } as unknown as PrismaService);
    await repository.create(appointment, 'actor-id');
    const sent = create.mock.calls[0][0] as {
      data: {
        requestedTime: string;
        endTime: string;
        history: { create: { toStatus: string; actorId: string } };
      };
    };
    expect(sent.data.requestedTime).toBe('09:00');
    expect(sent.data.endTime).toBe('10:00');
    expect(sent.data.history.create).toEqual({
      fromStatus: null,
      toStatus: 'AGUARDANDO',
      actorType: 'MANICURE',
      actorId: 'actor-id',
    });
  });

  it('traduz conflito de exclusão do PostgreSQL para conflito de horário', async () => {
    const create = jest.fn().mockRejectedValue({ code: '23P01' });
    const repository = new PrismaAppointmentRepository({
      appointmentModel: { create },
    } as unknown as PrismaService);
    await expect(repository.create(appointment, 'actor-id')).rejects.toThrow(
      AppointmentConflictError,
    );
  });

  it('só grava histórico se a mudança condicional de estado vencer', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 0 });
    const createEvent = jest.fn();
    const transaction = jest.fn(
      (operation: (tx: unknown) => Promise<unknown>) =>
        operation({
          appointmentModel: { updateMany },
          appointmentStatusEventModel: { create: createEvent },
        }),
    );
    const repository = new PrismaAppointmentRepository({
      $transaction: transaction,
    } as unknown as PrismaService);
    const confirmed = appointment.decide('CONFIRMADO');
    await expect(
      repository.transition(appointment, confirmed, 'actor-id'),
    ).rejects.toThrow(AppointmentConflictError);
    expect(createEvent).not.toHaveBeenCalled();
  });

  it('grava a sugestão e seu histórico na mesma transação', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const createEvent = jest.fn((args: unknown) => Promise.resolve(args));
    const createAutomationEvent = jest.fn((args: unknown) =>
      Promise.resolve(args),
    );
    const transaction = jest.fn(
      (operation: (tx: unknown) => Promise<unknown>) =>
        operation({
          appointmentModel: { updateMany },
          appointmentStatusEventModel: { create: createEvent },
          automationEventModel: { create: createAutomationEvent },
        }),
    );
    const repository = new PrismaAppointmentRepository({
      $transaction: transaction,
    } as unknown as PrismaService);
    const suggested = appointment.decide(
      'REAGENDAMENTO_SUGERIDO',
      undefined,
      '2099-10-08',
      '11:00',
    );
    await repository.transition(appointment, suggested, 'actor-id');
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(createEvent).toHaveBeenCalledTimes(1);
    const automationEvent = createAutomationEvent.mock.calls[0][0] as {
      data: { type: string; aggregateId: string; payload: { status: string } };
    };
    expect(automationEvent.data.type).toBe('appointment.status_changed');
    expect(automationEvent.data.aggregateId).toBe(suggested.id);
    expect(automationEvent.data.payload.status).toBe('REAGENDAMENTO_SUGERIDO');
    const event = createEvent.mock.calls[0][0] as {
      data: {
        fromStatus: string;
        toStatus: string;
        actorId: string;
        proposedTime: string;
      };
    };
    expect(event.data).toMatchObject({
      fromStatus: 'AGUARDANDO',
      toStatus: 'REAGENDAMENTO_SUGERIDO',
      actorId: 'actor-id',
      proposedTime: '11:00',
    });
  });
});
