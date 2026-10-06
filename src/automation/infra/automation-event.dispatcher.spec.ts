/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-type-assertion */
import { PrismaService } from '../../infra/database/prisma.service';
import { VerifyAutomationEventUseCase } from '../application/verify-automation-event.usecase';
import { AutomationEventDispatcher } from './automation-event.dispatcher';

describe('AutomationEventDispatcher', () => {
  const secret = 's'.repeat(40);
  const event = {
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

  it('assina evento persistido e confirma a entrega após HTTP 2xx', async () => {
    const update = jest.fn().mockResolvedValue({});
    const prisma = {
      automationEventModel: {
        findMany: jest.fn().mockResolvedValue([event]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update,
        findUnique: jest.fn().mockResolvedValue(event),
      },
    } as unknown as PrismaService;
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    const dispatcher = new AutomationEventDispatcher(prisma) as unknown as {
      dispatchDue(url: string, secret: string): Promise<void>;
    };

    await dispatcher.dispatchDue('http://n8n:5678/webhook/test', secret);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['x-lari-event-id']).toBe(event.id);
    const verifier = new VerifyAutomationEventUseCase(prisma);
    process.env.AUTOMATION_EVENT_WEBHOOK_SECRET = secret;
    try {
      await expect(
        verifier.execute(
          event.id,
          headers['x-lari-timestamp'],
          headers['x-lari-signature'],
        ),
      ).resolves.toMatchObject({ event: { id: event.id } });
    } finally {
      delete process.env.AUTOMATION_EVENT_WEBHOOK_SECRET;
    }
    expect(update).toHaveBeenCalledWith({
      where: { id: event.id },
      data: {
        deliveredAt: expect.any(Date),
        lockedUntil: null,
        lastError: null,
      },
    });
  });

  it('mantém o evento para nova tentativa após falha HTTP', async () => {
    const update = jest.fn().mockResolvedValue({});
    const prisma = {
      automationEventModel: {
        findMany: jest.fn().mockResolvedValue([event]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update,
      },
    } as unknown as PrismaService;
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;
    const dispatcher = new AutomationEventDispatcher(prisma) as unknown as {
      dispatchDue(url: string, secret: string): Promise<void>;
    };

    await dispatcher.dispatchDue('http://n8n:5678/webhook/test', secret);

    const call = update.mock.calls[0][0] as {
      data: {
        attempts: { increment: number };
        nextAttemptAt: Date;
        deliveredAt?: Date;
      };
    };
    expect(call.data.attempts.increment).toBe(1);
    expect(call.data.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
    expect(call.data.deliveredAt).toBeUndefined();
  });
});
