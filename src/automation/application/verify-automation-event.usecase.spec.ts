import { createHmac } from 'crypto';
import { PrismaService } from '../../infra/database/prisma.service';
import { VerifyAutomationEventUseCase } from './verify-automation-event.usecase';

const id = 'dabea031-504f-43b6-86d0-8c1b843ef8e4';
const record = {
  id,
  type: 'appointment.status_changed',
  aggregateId: id,
  payload: { status: 'CONFIRMADO' },
  createdAt: new Date('2026-10-06T19:00:00.000Z'),
};

describe('VerifyAutomationEventUseCase', () => {
  const secret = 's'.repeat(40);
  const useCase = new VerifyAutomationEventUseCase({
    automationEventModel: { findUnique: jest.fn().mockResolvedValue(record) },
  } as unknown as PrismaService);

  beforeAll(() => {
    process.env.AUTOMATION_EVENT_WEBHOOK_SECRET = secret;
  });
  afterAll(() => {
    delete process.env.AUTOMATION_EVENT_WEBHOOK_SECRET;
  });

  it('aceita evento assinado e rejeita assinatura ou data inválida', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const canonical = {
      id: record.id,
      type: record.type,
      aggregateId: record.aggregateId,
      payload: record.payload,
      createdAt: record.createdAt.toISOString(),
    };
    const signature = `sha256=${createHmac('sha256', secret)
      .update(`${timestamp}.${JSON.stringify(canonical)}`)
      .digest('hex')}`;
    await expect(useCase.execute(id, timestamp, signature)).resolves.toEqual({
      event: canonical,
    });
    await expect(
      useCase.execute(id, timestamp, `sha256=${'0'.repeat(64)}`),
    ).rejects.toThrow('Assinatura inválida');
    await expect(
      useCase.execute(id, String(Number(timestamp) - 301), signature),
    ).rejects.toThrow('Evento expirado');
  });
});
