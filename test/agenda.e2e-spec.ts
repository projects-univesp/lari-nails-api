import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'crypto';
import { AgendaModule } from '../src/agenda/agenda.module';
import { BusinessHours, AgendaBlock } from '../src/agenda/domain/agenda.rules';
import { PrismaService } from '../src/infra/database/prisma.service';
import { FindServiceUseCase } from '../src/services/application/find.service.usecase';
import { Service } from '../src/services/domain/service.entity';

describe('AgendaController (e2e)', () => {
  let app: INestApplication<App>;
  let hours: BusinessHours[] = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isOpen: false,
    openTime: null,
    closeTime: null,
    lunchStart: null,
    lunchEnd: null,
  }));
  const blocks = new Map<string, AgendaBlock>();
  const service = new Service({
    name: 'Manicure',
    category: 'Mãos',
    priceCents: 4500,
    durationMinutes: 60,
  });
  const repository = {
    listBusinessHours: jest.fn(() => Promise.resolve(hours)),
    replaceBusinessHours: jest.fn((next: BusinessHours[]) => {
      hours = next;
      return Promise.resolve();
    }),
    listBlocks: jest.fn((from: string, to: string) =>
      Promise.resolve(
        [...blocks.values()].filter(
          (block) => block.date >= from && block.date <= to,
        ),
      ),
    ),
    listOccupied: jest.fn().mockResolvedValue([]),
    findBlock: jest.fn((id: string) => Promise.resolve(blocks.get(id) ?? null)),
    createBlock: jest.fn(
      (
        input: Pick<AgendaBlock, 'reason' | 'date' | 'startTime' | 'endTime'>,
      ) => {
        const record = {
          ...input,
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        blocks.set(record.id, record);
        return Promise.resolve(record);
      },
    ),
    updateBlock: jest.fn(
      (
        id: string,
        input: Pick<AgendaBlock, 'reason' | 'date' | 'startTime' | 'endTime'>,
      ) => {
        const record = { ...blocks.get(id)!, ...input, updatedAt: new Date() };
        blocks.set(id, record);
        return Promise.resolve(record);
      },
    ),
    deleteBlock: jest.fn((id: string) => {
      blocks.delete(id);
      return Promise.resolve();
    }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AgendaModule] })
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn(), $disconnect: jest.fn() })
      .overrideProvider('IAgendaRepository')
      .useValue(repository)
      .overrideProvider(FindServiceUseCase)
      .useValue({ execute: jest.fn().mockResolvedValue(service) })
      .compile();
    app = module.createNestApplication();
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

  it('valida e salva os sete dias da semana', async () => {
    const invalid = await request(app.getHttpServer())
      .put('/business-hours')
      .send({ days: [{ dayOfWeek: 1, isOpen: true }] })
      .expect(400);
    expect((invalid.body as { message: string }).message).toContain(
      'Informe os sete dias da semana uma única vez',
    );

    const days = hours.map((day) =>
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
    await request(app.getHttpServer())
      .put('/business-hours')
      .send({ days })
      .expect(200);
    const response = await request(app.getHttpServer())
      .get('/business-hours')
      .expect(200);
    expect(response.body).toHaveLength(7);
    expect((response.body as BusinessHours[])[3].openTime).toBe('09:00');
  });

  it('cria, edita, lista e remove bloqueios', async () => {
    const created = await request(app.getHttpServer())
      .post('/agenda-blocks')
      .send({
        reason: 'Compromisso',
        date: '2099-10-07',
        startTime: '09:00',
        endTime: '10:00',
      })
      .expect(201);
    const id = (created.body as { id: string }).id;
    await request(app.getHttpServer())
      .patch(`/agenda-blocks/${id}`)
      .send({ endTime: '10:30' })
      .expect(200);
    const listed = await request(app.getHttpServer())
      .get('/agenda-blocks?from=2099-10-07&to=2099-10-07')
      .expect(200);
    expect(listed.body).toMatchObject([{ id, endTime: '10:30' }]);
    await request(app.getHttpServer())
      .delete(`/agenda-blocks/${id}`)
      .expect(204);
    expect(
      (
        await request(app.getHttpServer())
          .get('/agenda-blocks?from=2099-10-07&to=2099-10-07')
          .expect(200)
      ).body,
    ).toEqual([]);
  });

  it('rejeita parâmetros inválidos e consulta disponibilidade', async () => {
    await request(app.getHttpServer())
      .get('/availability?serviceId=invalid&from=2099-10-07&to=2099-10-07')
      .expect(400);
    await request(app.getHttpServer())
      .post('/agenda-blocks')
      .send({
        reason: 'Inválido',
        date: '2099-02-30',
        startTime: '09:00',
        endTime: '10:00',
      })
      .expect(400);
    const response = await request(app.getHttpServer())
      .get(
        `/availability?serviceId=${service.id}&from=2099-10-07&to=2099-10-07`,
      )
      .expect(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
