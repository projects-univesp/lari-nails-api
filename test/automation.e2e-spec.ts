import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AutomationModule } from '../src/automation/automation.module';
import { SecurityModule } from '../src/infra/security/security.module';
import { PrismaService } from '../src/infra/database/prisma.service';
import { FindAllServiceUseCase } from '../src/services/application/find-all.service.usecase';
import { BusinessHoursUseCase } from '../src/agenda/application/business-hours.usecase';
import { FindAvailabilityUseCase } from '../src/agenda/application/find-availability.usecase';
import { ResolveAutomationClientUseCase } from '../src/clients/application/resolve-automation-client.usecase';
import { FindClientUseCase } from '../src/clients/application/find.client.usecase';
import { AppointmentUseCase } from '../src/appointments/application/appointment.usecase';
import { Appointment } from '../src/appointments/domain/appointment.entity';
import { Client } from '../src/clients/domain/client.entity';

describe('AutomationController (e2e)', () => {
  let app: INestApplication<App>;
  const key = 'a'.repeat(40);
  const client = new Client('Maria', '+5511987654321');
  const appointment = new Appointment({
    clientId: client.getId(),
    serviceId: '38088ad1-a26b-4b20-a004-43ff9c442379',
    requestedDate: '2099-10-07',
    requestedTime: '09:00',
    durationMinutes: 60,
    priceCents: 4500,
    source: 'WHATSAPP_BOT',
  });
  const create = jest.fn().mockResolvedValue(appointment);

  beforeAll(async () => {
    process.env.AUTOMATION_API_KEY = key;
    const module = await Test.createTestingModule({
      imports: [SecurityModule, AutomationModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn(), $disconnect: jest.fn() })
      .overrideProvider(FindAllServiceUseCase)
      .useValue({ execute: jest.fn().mockResolvedValue([]) })
      .overrideProvider(BusinessHoursUseCase)
      .useValue({ list: jest.fn().mockResolvedValue([]) })
      .overrideProvider(FindAvailabilityUseCase)
      .useValue({ execute: jest.fn().mockResolvedValue([]) })
      .overrideProvider(ResolveAutomationClientUseCase)
      .useValue({
        execute: jest.fn().mockResolvedValue({ client, created: false }),
      })
      .overrideProvider(FindClientUseCase)
      .useValue({ execute: jest.fn().mockResolvedValue(client) })
      .overrideProvider(AppointmentUseCase)
      .useValue({ create, find: jest.fn().mockResolvedValue(appointment) })
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
    delete process.env.AUTOMATION_API_KEY;
  });

  it('rejeita sessão humana e chave incorreta; aceita chave de automação', async () => {
    await request(app.getHttpServer()).get('/automation/services').expect(401);
    await request(app.getHttpServer())
      .get('/automation/services')
      .set('Authorization', 'Bearer human-token')
      .expect(401);
    await request(app.getHttpServer())
      .get('/automation/services')
      .set('x-automation-key', 'wrong')
      .expect(401);
    await request(app.getHttpServer())
      .get('/automation/services')
      .set('x-automation-key', key)
      .expect(200, []);
  });

  it('resolve cliente e fixa a origem do agendamento como WhatsApp', async () => {
    const resolved = await request(app.getHttpServer())
      .post('/automation/clients/resolve')
      .set('x-automation-key', key)
      .send({ nome: 'Maria', telefone: '5511987654321@s.whatsapp.net' })
      .expect(201);
    expect(resolved.body).toMatchObject({
      created: false,
      client: { id: client.getId() },
    });
    await request(app.getHttpServer())
      .post('/automation/appointments')
      .set('x-automation-key', key)
      .send({
        clientId: client.getId(),
        serviceId: appointment.serviceId,
        requestedDate: '2099-10-07',
        requestedTime: '09:00',
        source: 'MANUAL',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/automation/appointments')
      .set('x-automation-key', key)
      .send({
        clientId: client.getId(),
        serviceId: appointment.serviceId,
        requestedDate: '2099-10-07',
        requestedTime: '09:00',
      })
      .expect(201);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'WHATSAPP_BOT' }),
      'automation:n8n',
    );
  });
});
