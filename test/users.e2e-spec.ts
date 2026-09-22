/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { UsersModule } from '../src/users/users.module';
import { PrismaService } from '../src/infra/database/prisma.service';

describe('Users & Auth Setup (e2e)', () => {
  let app: INestApplication<App>;

  const mockUsers: any[] = [];

  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    userModel: {
      count: jest.fn().mockImplementation(({ where }: any = {}) => {
        if (where && where.deletedAt === null) {
          return Promise.resolve(mockUsers.filter((u) => !u.deletedAt).length);
        }
        return Promise.resolve(mockUsers.length);
      }),
      upsert: jest.fn().mockImplementation(({ where, create, update }: any) => {
        const index = mockUsers.findIndex((u) => u.id === where?.id);
        if (index !== -1) {
          Object.assign(mockUsers[index], update);
          return Promise.resolve(mockUsers[index]);
        } else {
          mockUsers.push(create);
          return Promise.resolve(create);
        }
      }),
      findMany: jest.fn().mockImplementation(({ where }: any = {}) => {
        if (where && where.deletedAt === null) {
          return Promise.resolve(mockUsers.filter((u) => !u.deletedAt));
        }
        return Promise.resolve(mockUsers);
      }),
      findFirst: jest
        .fn()
        .mockImplementation(({ where: { id, email } }: any) => {
          const found = mockUsers.find(
            (u) => (id ? u.id === id : u.email === email) && !u.deletedAt,
          );
          return Promise.resolve(found || null);
        }),
      findUnique: jest.fn().mockImplementation(({ where: { id } }: any) => {
        const found = mockUsers.find((u) => u.id === id);
        return Promise.resolve(found || null);
      }),
      update: jest.fn().mockImplementation(({ where: { id }, data }: any) => {
        const user = mockUsers.find((u) => u.id === id);
        if (user) {
          Object.assign(user, data);
        }
        return Promise.resolve(user || {});
      }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UsersModule],
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

  it('/auth/setup-status (GET) - Deve indicar necessidade de setup', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/setup-status')
      .expect(200);

    expect(response.body).toEqual({ needsSetup: true });
  });

  it('/auth/setup (POST) - Deve criar o primeiro admin com sucesso', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/setup')
      .send({
        nome: 'Administradora Lari',
        email: 'lari@larinails.com',
        senha: 'adminpassword123',
      })
      .expect(201);

    expect(response.body.message).toBe('Setup inicial concluído com sucesso');
    expect(response.body.user.email).toBe('lari@larinails.com');
    expect(response.body.user.role).toBe('admin');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('/auth/setup-status (GET) - Apos setup, nao deve mais necessitar setup', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/setup-status')
      .expect(200);

    expect(response.body).toEqual({ needsSetup: false });
  });

  it('/auth/setup (POST) - Deve bloquear nova chamada de setup', async () => {
    await request(app.getHttpServer())
      .post('/auth/setup')
      .send({
        nome: 'Outro Admin',
        email: 'outro@larinails.com',
        senha: 'adminpassword123',
      })
      .expect(403);
  });

  it('/users (POST) - Deve criar uma colaboradora', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: 'Carla Manicure',
        email: 'carla@larinails.com',
        senha: 'password123',
        role: 'colaborador',
      })
      .expect(201);

    expect(response.body.message).toBe('Usuario criado com sucesso');
    expect(response.body.user.nome).toBe('Carla Manicure');
    expect(response.body.user.role).toBe('colaborador');
    expect(response.body.user).not.toHaveProperty('senha');
  });

  it('/users (GET) - Deve listar usuarios ativos', async () => {
    const response = await request(app.getHttpServer())
      .get('/users')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
  });

  it('/users/:id (PATCH) - Deve atualizar dados do usuario', async () => {
    const colab = mockUsers.find((u) => u.email === 'carla@larinails.com');
    const response = await request(app.getHttpServer())
      .patch(`/users/${colab.id}`)
      .send({
        nome: 'Carla Manicure Atualizada',
      })
      .expect(200);

    expect(response.body.message).toBe('Usuario atualizado com sucesso');
    expect(response.body.user.nome).toBe('Carla Manicure Atualizada');
  });

  it('/users/:id (DELETE) - Deve desativar usuario (soft delete)', async () => {
    const colab = mockUsers.find((u) => u.email === 'carla@larinails.com');
    await request(app.getHttpServer()).delete(`/users/${colab.id}`).expect(200);

    const listResponse = await request(app.getHttpServer())
      .get('/users')
      .expect(200);

    expect(listResponse.body.length).toBe(1);
    expect(listResponse.body[0].email).toBe('lari@larinails.com');
  });

  it('/users/:id/restore (PATCH) - Deve reativar usuario inativo', async () => {
    const colab = mockUsers.find((u) => u.email === 'carla@larinails.com');
    const response = await request(app.getHttpServer())
      .patch(`/users/${colab.id}/restore`)
      .expect(200);

    expect(response.body.message).toBe('Usuario reativado com sucesso');
    expect(response.body.user.id).toBe(colab.id);

    const listResponse = await request(app.getHttpServer())
      .get('/users')
      .expect(200);

    expect(listResponse.body.length).toBe(2);
  });
});
