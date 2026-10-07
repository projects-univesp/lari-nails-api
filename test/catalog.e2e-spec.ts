import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { CatalogModule } from '../src/catalog/catalog.module';
import { PrismaService } from '../src/infra/database/prisma.service';

interface StoredService {
  id: string;
  name: string;
  category: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

describe('CatalogItemController (e2e)', () => {
  let app: INestApplication<App>;
  const records = new Map<string, StoredService>();

  const prisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    catalogItemModel: {
      upsert: jest.fn(
        (args: {
          where: { id: string };
          create: StoredService;
          update: Partial<StoredService>;
        }) => {
          const current = records.get(args.where.id);
          records.set(
            args.where.id,
            current ? { ...current, ...args.update } : args.create,
          );
          return Promise.resolve(records.get(args.where.id));
        },
      ),
      findUnique: jest.fn((args: { where: { id: string } }) =>
        Promise.resolve(records.get(args.where.id) ?? null),
      ),
      findMany: jest.fn((args: { where?: { active: boolean } }) =>
        Promise.resolve(
          [...records.values()].filter(
            (record) =>
              args.where === undefined || record.active === args.where.active,
          ),
        ),
      ),
    },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [CatalogModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
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

  it('cadastra, lista, filtra e atualiza o serviço', async () => {
    const created = await request(app.getHttpServer())
      .post('/catalog')
      .send({
        name: 'Manicure',
        category: 'Mãos',
        priceCents: 4500,
        durationMinutes: 60,
      })
      .expect(201);
    const id = (created.body as { id: string }).id;
    expect(created.body).toMatchObject({
      id,
      priceCents: 4500,
      durationMinutes: 60,
      active: true,
    });

    const listed = await request(app.getHttpServer())
      .get('/catalog?active=true')
      .expect(200);
    expect(listed.body).toHaveLength(1);

    const updated = await request(app.getHttpServer())
      .patch(`/catalog/${id}`)
      .send({
        priceCents: 5000,
        active: false,
        description: 'Esmaltação tradicional',
      })
      .expect(200);
    expect(updated.body).toMatchObject({
      id,
      priceCents: 5000,
      durationMinutes: 60,
      active: false,
      description: 'Esmaltação tradicional',
    });
    expect(
      (
        await request(app.getHttpServer())
          .get('/catalog?active=true')
          .expect(200)
      ).body,
    ).toHaveLength(0);
    expect(
      (
        await request(app.getHttpServer())
          .get('/catalog?active=false')
          .expect(200)
      ).body,
    ).toHaveLength(1);
    expect(
      (await request(app.getHttpServer()).get(`/catalog/${id}`).expect(200))
        .body,
    ).toMatchObject({ priceCents: 5000 });
  });

  it('rejeita preço e duração inválidos sem alterar o registro', async () => {
    const id = [...records.keys()][0];
    await request(app.getHttpServer())
      .patch(`/catalog/${id}`)
      .send({ name: 'Alterado', priceCents: -1 })
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/catalog/${id}`)
      .send({ durationMinutes: 0 })
      .expect(400);
    expect(records.get(id)?.name).toBe('Manicure');
  });

  it('rejeita campos inesperados e retorna 404 para serviço ausente', async () => {
    await request(app.getHttpServer())
      .post('/catalog')
      .send({
        name: 'Pedicure',
        category: 'Pés',
        priceCents: 5000,
        durationMinutes: 60,
        other: true,
      })
      .expect(400);
    await request(app.getHttpServer())
      .get('/catalog/2cd35d92-45bb-4470-bec6-e4b0aaf50142')
      .expect(404);
  });
});
