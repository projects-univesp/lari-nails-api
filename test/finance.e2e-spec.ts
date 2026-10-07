import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import type { NextFunction, Request, Response } from 'express';
import { FinanceModule } from '../src/finance/finance.module';
import { PrismaService } from '../src/infra/database/prisma.service';

interface StoredAppointment {
  id: string;
  clientId: string;
  serviceId: string;
  status: string;
  requestedDate: Date;
  requestedTime: string;
  client: { nome: string };
  service: { name: string };
}

interface StoredPayment {
  id: string;
  appointmentId: string;
  amountCents: number;
  status: string;
  method: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const APPOINTMENT_ID = '2cd35d92-45bb-4470-bec6-e4b0aaf50142';

describe('FinanceController (e2e)', () => {
  let app: INestApplication<App>;
  const appointments = new Map<string, StoredAppointment>();
  const payments = new Map<string, StoredPayment>();
  const statusEvents: unknown[] = [];
  const automationEvents: unknown[] = [];

  const relations = (payment: StoredPayment) => {
    const appointment = appointments.get(payment.appointmentId)!;
    return {
      ...payment,
      appointment: {
        ...appointment,
        client: appointment.client,
        service: appointment.service,
      },
    };
  };

  const prismaModels = {
    appointmentModel: {
      findUnique: jest.fn((args: { where: { id: string } }) =>
        Promise.resolve(appointments.get(args.where.id) ?? null),
      ),
      updateMany: jest.fn(
        (args: {
          where: { id: string; status: string };
          data: { status: string };
        }) => {
          const current = appointments.get(args.where.id);
          if (!current || current.status !== args.where.status) {
            return Promise.resolve({ count: 0 });
          }
          current.status = args.data.status;
          return Promise.resolve({ count: 1 });
        },
      ),
    },
    paymentModel: {
      create: jest.fn((args: { data: StoredPayment }) => {
        payments.set(args.data.id, {
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return Promise.resolve(payments.get(args.data.id));
      }),
      findUnique: jest.fn((args: { where: { id: string } }) => {
        const payment = payments.get(args.where.id);
        return Promise.resolve(payment ? relations(payment) : null);
      }),
      findMany: jest.fn(() =>
        Promise.resolve([...payments.values()].map((p) => relations(p))),
      ),
      updateMany: jest.fn(
        (args: {
          where: { id: string; status: string };
          data: Partial<StoredPayment>;
        }) => {
          const current = payments.get(args.where.id);
          if (!current || current.status !== args.where.status) {
            return Promise.resolve({ count: 0 });
          }
          payments.set(args.where.id, { ...current, ...args.data });
          return Promise.resolve({ count: 1 });
        },
      ),
    },
    appointmentStatusEventModel: {
      create: jest.fn((args: { data: unknown }) => {
        statusEvents.push(args.data);
        return Promise.resolve(args.data);
      }),
    },
    automationEventModel: {
      create: jest.fn((args: { data: unknown }) => {
        automationEvents.push(args.data);
        return Promise.resolve(args.data);
      }),
    },
  };

  const prisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn((cb: (tx: typeof prismaModels) => unknown) =>
      Promise.resolve(cb(prismaModels)),
    ),
    ...prismaModels,
  };

  beforeAll(async () => {
    appointments.set(APPOINTMENT_ID, {
      id: APPOINTMENT_ID,
      clientId: 'c1',
      serviceId: 's1',
      status: 'CONFIRMADO',
      requestedDate: new Date('2099-10-07T00:00:00.000Z'),
      requestedTime: '09:00',
      client: { nome: 'Maria' },
      service: { name: 'Manicure' },
    });

    const module = await Test.createTestingModule({ imports: [FinanceModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { sub: 'f13b1e74-bafe-49eb-8683-b443a216163c', role: 'admin' };
      next();
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('faz checkout recebido, lista e exige forma de pagamento', async () => {
    const checkout = await request(app.getHttpServer())
      .post(`/finance/appointments/${APPOINTMENT_ID}/checkout`)
      .send({ amountCents: 4500, status: 'RECEBIDO', method: 'PIX' })
      .expect(201);
    expect(checkout.body).toMatchObject({
      appointmentId: APPOINTMENT_ID,
      amountCents: 4500,
      status: 'RECEBIDO',
      method: 'PIX',
      clientName: 'Maria',
      serviceName: 'Manicure',
    });
    expect(appointments.get(APPOINTMENT_ID)?.status).toBe('CONCLUIDO');
    expect(statusEvents).toHaveLength(1);
    expect(automationEvents).toHaveLength(1);

    const listed = await request(app.getHttpServer())
      .get('/finance/transactions?from=2099-10-01&to=2099-10-31')
      .expect(200);
    expect(listed.body).toHaveLength(1);
  });

  it('rejeita checkout recebido sem forma de pagamento (400 via DTO)', async () => {
    appointments.set('11111111-1111-4111-8111-111111111111', {
      id: '11111111-1111-4111-8111-111111111111',
      clientId: 'c1',
      serviceId: 's1',
      status: 'CONFIRMADO',
      requestedDate: new Date('2099-10-07T00:00:00.000Z'),
      requestedTime: '10:00',
      client: { nome: 'Ana' },
      service: { name: 'Pedicure' },
    });
    await request(app.getHttpServer())
      .post(
        '/finance/appointments/11111111-1111-4111-8111-111111111111/checkout',
      )
      .send({ amountCents: 4500, status: 'RECEBIDO' })
      .expect(400);
  });

  it('retorna 404 ao concluir atendimento inexistente', async () => {
    await request(app.getHttpServer())
      .post(
        '/finance/appointments/99999999-9999-4999-8999-999999999999/checkout',
      )
      .send({ amountCents: 4500, status: 'PENDENTE' })
      .expect(404);
  });

  it('rejeita período inválido na listagem (409)', async () => {
    await request(app.getHttpServer())
      .get('/finance/transactions?from=2099-13-01&to=2099-10-31')
      .expect(409);
  });

  it('recebe um pagamento pendente e bloqueia duplo recebimento', async () => {
    appointments.set('22222222-2222-4222-8222-222222222222', {
      id: '22222222-2222-4222-8222-222222222222',
      clientId: 'c1',
      serviceId: 's1',
      status: 'CONFIRMADO',
      requestedDate: new Date('2099-10-08T00:00:00.000Z'),
      requestedTime: '11:00',
      client: { nome: 'Bia' },
      service: { name: 'Spa' },
    });
    const pending = await request(app.getHttpServer())
      .post(
        '/finance/appointments/22222222-2222-4222-8222-222222222222/checkout',
      )
      .send({ amountCents: 7000, status: 'PENDENTE' })
      .expect(201);
    const paymentId = (pending.body as { id: string }).id;

    const received = await request(app.getHttpServer())
      .patch(`/finance/transactions/${paymentId}/receive`)
      .send({ method: 'DINHEIRO' })
      .expect(200);
    expect(received.body).toMatchObject({
      status: 'RECEBIDO',
      method: 'DINHEIRO',
    });

    await request(app.getHttpServer())
      .patch(`/finance/transactions/${paymentId}/receive`)
      .send({ method: 'PIX' })
      .expect(409);
  });
});
