import { createHmac } from 'crypto';
import { AutomationEvent } from '../domain/automation-event.entity';
import { IAutomationEventRepository } from '../domain/automation-event.repository.interface';
import { VerifyAutomationEventUseCase } from './verify-automation-event.usecase';

const id = 'dabea031-504f-43b6-86d0-8c1b843ef8e4';
const event = new AutomationEvent({
  id,
  type: 'appointment.status_changed',
  aggregateId: id,
  payload: { status: 'CONFIRMADO' },
  createdAt: new Date('2026-10-06T19:00:00.000Z'),
});

describe('VerifyAutomationEventUseCase', () => {
  const secret = 's'.repeat(40);
  const repository: IAutomationEventRepository = {
    findById: jest.fn().mockResolvedValue(event),
    findDue: jest.fn(),
    claim: jest.fn(),
    markDelivered: jest.fn(),
    markFailed: jest.fn(),
  };
  const useCase = new VerifyAutomationEventUseCase(repository);

  beforeAll(() => {
    process.env.AUTOMATION_EVENT_WEBHOOK_SECRET = secret;
  });
  afterAll(() => {
    delete process.env.AUTOMATION_EVENT_WEBHOOK_SECRET;
  });

  it('aceita evento assinado e rejeita assinatura ou data inválida', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const canonical = event.toCanonical();
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

  it('rejeita evento inexistente', async () => {
    const repoEmpty: IAutomationEventRepository = {
      findById: jest.fn().mockResolvedValue(null),
      findDue: jest.fn(),
      claim: jest.fn(),
      markDelivered: jest.fn(),
      markFailed: jest.fn(),
    };
    const useCaseEmpty = new VerifyAutomationEventUseCase(repoEmpty);
    const timestamp = String(Math.floor(Date.now() / 1000));
    await expect(
      useCaseEmpty.execute(id, timestamp, `sha256=${'0'.repeat(64)}`),
    ).rejects.toThrow('Evento não encontrado');
  });
});
