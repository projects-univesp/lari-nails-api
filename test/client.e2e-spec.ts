/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ClientModule } from '../src/clients/client.module';
import { PrismaService } from '../src/infra/database/prisma.service';

describe('ClientController (e2e)', () => {
  let app: INestApplication<App>;

  const mockClients: any[] = [];

  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    clientModel: {
      upsert: jest.fn().mockImplementation(({ where, create, update }: any) => {
        const index = mockClients.findIndex((c) => c.id === where?.id);
        if (index !== -1) {
          Object.assign(mockClients[index], update);
          return Promise.resolve(mockClients[index]);
        } else {
          mockClients.push(create);
          return Promise.resolve(create);
        }
      }),
      findMany: jest.fn().mockImplementation(({ where }: any = {}) => {
        if (where && where.deletedAt === null) {
          return Promise.resolve(mockClients.filter((c) => !c.deletedAt));
        }
        return Promise.resolve(mockClients);
      }),
      findFirst: jest.fn().mockImplementation(({ where }: any = {}) => {
        const found = mockClients.find((c) => {
          const matchId = where.id ? c.id === where.id : true;
          const matchDeleted = where.deletedAt === null ? !c.deletedAt : true;
          return matchId && matchDeleted;
        });
        return Promise.resolve(found || null);
      }),
      findUnique: jest.fn().mockImplementation(({ where: { id } }: any) => {
        const found = mockClients.find((c) => c.id === id);
        return Promise.resolve(found || null);
      }),
      update: jest.fn().mockImplementation(({ where: { id }, data }: any) => {
        const client = mockClients.find((c) => c.id === id);
        if (client) {
          Object.assign(client, data);
        }
        return Promise.resolve(client || {});
      }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ClientModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();

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

  it('/clients (POST) - Deve criar um cliente', async () => {
    const response = await request(app.getHttpServer())
      .post('/clients')
      .send({
        nome: 'Maria da Silva',
        telefone: '(11) 98765-4321',
      })
      .expect(201);

    expect(response.body).toEqual({
      message: 'Cliente criado com sucesso',
    });
  });

  it('/clients (POST) - Deve barrar campos invalidos (Testando o DTO)', async () => {
    const response = await request(app.getHttpServer())
      .post('/clients')
      .send({
        nome: '',
        telefone: '(11) 98765-4321',
      })
      .expect(400);

    expect(response.body.message).toContain('O nome é obrigatório');
  });

  it('/clients (GET) - Deve listar os clientes criados', async () => {
    const response = await request(app.getHttpServer())
      .get('/clients')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('nome', 'Maria da Silva');
    expect(response.body[0]).toHaveProperty('telefone', '(11) 98765-4321');
    expect(response.body[0]).toHaveProperty('status', 'ativo');
    expect(response.body[0]).toHaveProperty('totalFaltas', 0);
    expect(response.body[0]).toHaveProperty('createdAt');
    expect(response.body[0]).toHaveProperty('updatedAt');
    expect(response.body[0]).toHaveProperty('_links');
  });

  it('/clients/:id (PATCH) - Deve atualizar dados do cliente', async () => {
    const clientId = mockClients[0].id;
    const response = await request(app.getHttpServer())
      .patch(`/clients/${clientId}`)
      .send({
        telefone: '(11) 99999-0000',
        totalFaltas: 1,
      })
      .expect(200);

    expect(response.body.message).toBe('Cliente atualizado com sucesso');
    expect(response.body.client.telefone).toBe('(11) 99999-0000');
    expect(response.body.client.totalFaltas).toBe(1);
  });

  it('/clients/:id (DELETE) - Deve executar soft delete do cliente', async () => {
    const clientId = mockClients[0].id;
    await request(app.getHttpServer())
      .delete(`/clients/${clientId}`)
      .expect(200);

    const getResponse = await request(app.getHttpServer())
      .get(`/clients/${clientId}`)
      .expect(200);

    expect(getResponse.body).toEqual({});
  });

  it('/clients/:id/restore (PATCH) - Deve reativar o cliente excluido', async () => {
    const clientId = mockClients[0].id;
    const response = await request(app.getHttpServer())
      .patch(`/clients/${clientId}/restore`)
      .expect(200);

    expect(response.body.message).toBe('Cliente reativado com sucesso');
    expect(response.body.client.id).toBe(clientId);

    const listResponse = await request(app.getHttpServer())
      .get('/clients')
      .expect(200);

    expect(listResponse.body.length).toBe(1);
  });
});
