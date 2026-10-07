import { AutomationEvent } from '../domain/automation-event.entity';
import { IAutomationEventRepository } from '../domain/automation-event.repository.interface';
import { VerifyAutomationEventUseCase } from '../application/verify-automation-event.usecase';
import { AutomationEventDispatcher } from './automation-event.dispatcher';

describe('AutomationEventDispatcher', () => {
  const secret = 's'.repeat(40);
  const pending = {
    id: 'dabea031-504f-43b6-86d0-8c1b843ef8e4',
    type: 'appointment.status_changed',
    aggregateId: 'dabea031-504f-43b6-86d0-8c1b843ef8e4',
    payload: { status: 'CONFIRMADO' },
    createdAt: new Date('2026-10-06T19:00:00.000Z'),
    attempts: 0,
  };
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const buildRepository = (): IAutomationEventRepository => ({
    findById: jest.fn().mockResolvedValue(new AutomationEvent(pending)),
    findDue: jest.fn().mockResolvedValue([pending]),
    claim: jest.fn().mockResolvedValue(true),
    markDelivered: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
  });

  it('assina evento, confirma entrega após HTTP 2xx e a assinatura é verificável', async () => {
    const repository = buildRepository();
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    const dispatcher = new AutomationEventDispatcher(
      repository,
    ) as unknown as {
      dispatchDue(url: string, secret: string): Promise<void>;
    };

    await dispatcher.dispatchDue('http://n8n:5678/webhook/test', secret);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['x-lari-event-id']).toBe(pending.id);
    expect(repository.markDelivered).toHaveBeenCalledWith(pending.id);

    process.env.AUTOMATION_EVENT_WEBHOOK_SECRET = secret;
    try {
      const verifier = new VerifyAutomationEventUseCase(repository);
      await expect(
        verifier.execute(
          pending.id,
          headers['x-lari-timestamp'],
          headers['x-lari-signature'],
        ),
      ).resolves.toMatchObject({ event: { id: pending.id } });
    } finally {
      delete process.env.AUTOMATION_EVENT_WEBHOOK_SECRET;
    }
  });

  it('mantém o evento para nova tentativa após falha HTTP', async () => {
    const repository = buildRepository();
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;
    const dispatcher = new AutomationEventDispatcher(
      repository,
    ) as unknown as {
      dispatchDue(url: string, secret: string): Promise<void>;
    };

    await dispatcher.dispatchDue('http://n8n:5678/webhook/test', secret);

    expect(repository.markFailed).toHaveBeenCalledTimes(1);
    const call = (repository.markFailed as jest.Mock).mock.calls[0] as [
      string,
      Date,
      string,
    ];
    expect(call[0]).toBe(pending.id);
    expect(call[1].getTime()).toBeGreaterThan(Date.now());
    expect(repository.markDelivered).not.toHaveBeenCalled();
  });
});
