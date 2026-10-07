import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppointmentModule } from '../src/appointments/appointment.module';
import { Appointment } from '../src/appointments/domain/appointment.entity';
import { FindAvailabilityUseCase } from '../src/agenda/application/find-availability.usecase';
import { FindClientUseCase } from '../src/clients/application/find.client.usecase';
import { Client } from '../src/clients/domain/client.entity';
import { PrismaService } from '../src/infra/database/prisma.service';
import { FindCatalogItemUseCase } from '../src/catalog/application/find.catalog-item.usecase';
import { CatalogItem } from '../src/catalog/domain/catalog-item.entity';

describe('AppointmentController (e2e)', () => {
  let app: INestApplication<App>;
  const client = new Client('Maria', '11999999999');
  const service = new CatalogItem({
    name: 'Manicure',
    category: 'Mãos',
    priceCents: 4500,
    durationMinutes: 60,
  });
  const records = new Map<string, Appointment>();
  const repository = {
    create: jest.fn((appointment: Appointment) => {
      records.set(appointment.id, appointment);
      return Promise.resolve(appointment);
    }),
    findById: jest.fn((id: string) => Promise.resolve(records.get(id) ?? null)),
    list: jest.fn((from: string, to: string, status?: string) =>
      Promise.resolve(
        [...records.values()].filter(
          (item) =>
            item.requestedDate >= from &&
            item.requestedDate <= to &&
            (!status || item.status === status),
        ),
      ),
    ),
    listPending: jest.fn(() =>
      Promise.resolve(
        [...records.values()].filter((item) => item.status === 'AGUARDANDO'),
      ),
    ),
    transition: jest.fn((_current: Appointment, next: Appointment) => {
      records.set(next.id, next);
      return Promise.resolve(next);
    }),
    history: jest.fn().mockResolvedValue([]),
  };
  const availability = {
    execute: jest
      .fn()
      .mockResolvedValue([
        { date: '2099-10-07', startTime: '09:00', endTime: '10:00' },
      ]),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppointmentModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn(), $disconnect: jest.fn() })
      .overrideProvider('IAppointmentRepository')
      .useValue(repository)
      .overrideProvider(FindClientUseCase)
      .useValue({ execute: jest.fn().mockResolvedValue(client) })
      .overrideProvider(FindCatalogItemUseCase)
      .useValue({ execute: jest.fn().mockResolvedValue(service) })
      .overrideProvider(FindAvailabilityUseCase)
      .useValue(availability)
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

  it('cria, lista e aprova um pedido aguardando', async () => {
    const created = await request(app.getHttpServer())
      .post('/appointments')
      .send({
        clientId: client.getId(),
        serviceId: service.id,
        requestedDate: '2099-10-07',
        requestedTime: '09:00',
        source: 'MANUAL',
      })
      .expect(201);
    const id = (created.body as { id: string }).id;
    expect(created.body).toMatchObject({
      id,
      status: 'AGUARDANDO',
      endTime: '10:00',
      priceCents: 4500,
    });
    const listed = await request(app.getHttpServer())
      .get('/appointments?from=2099-10-07&to=2099-10-07&status=AGUARDANDO')
      .expect(200);
    expect(listed.body).toHaveLength(1);
    const pending = await request(app.getHttpServer())
      .get('/appointments/pending')
      .expect(200);
    expect(pending.body).toMatchObject([{ id, status: 'AGUARDANDO' }]);
    const confirmed = await request(app.getHttpServer())
      .post(`/appointments/${id}/status`)
      .send({ status: 'CONFIRMADO' })
      .expect(200);
    expect(confirmed.body).toMatchObject({ id, status: 'CONFIRMADO' });
    await request(app.getHttpServer())
      .get('/appointments/pending')
      .expect(200, []);
    await request(app.getHttpServer())
      .post(`/appointments/${id}/status`)
      .send({ status: 'CANCELADO', reason: 'Teste' })
      .expect(409);
    await request(app.getHttpServer())
      .get(`/appointments/${id}/history`)
      .expect(200);
  });

  it('valida os dados antes de criar ou decidir', async () => {
    await request(app.getHttpServer())
      .post('/appointments')
      .send({
        clientId: client.getId(),
        serviceId: service.id,
        requestedDate: '2099-10-07',
        requestedTime: '99:00',
        source: 'MANUAL',
      })
      .expect(400);
    const id = [...records.keys()][0];
    await request(app.getHttpServer())
      .post(`/appointments/${id}/status`)
      .send({ status: 'INVALID' })
      .expect(400);
  });
});
