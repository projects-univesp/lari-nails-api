import { createHmac } from 'crypto';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';

@Injectable()
export class AutomationEventDispatcher
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AutomationEventDispatcher.name);
  private timer?: NodeJS.Timeout;
  private sending = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const url = process.env.AUTOMATION_EVENT_WEBHOOK_URL;
    const secret = process.env.AUTOMATION_EVENT_WEBHOOK_SECRET;
    if (!url && !secret) return;
    if (!url || !secret || secret.length < 32 || !this.validUrl(url)) {
      this.logger.error(
        'Configuração do webhook de automação inválida; eventos permanecerão na fila',
      );
      return;
    }
    this.timer = setInterval(() => {
      void this.dispatchDue(url, secret);
    }, 30_000);
    this.timer.unref();
    void this.dispatchDue(url, secret);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private validUrl(value: string): boolean {
    try {
      const url = new URL(value);
      if (url.username || url.password || url.hash) return false;
      return (
        url.protocol === 'https:' ||
        (url.protocol === 'http:' &&
          ['localhost', '127.0.0.1', 'n8n', 'lari_nails_n8n'].includes(
            url.hostname,
          ))
      );
    } catch {
      return false;
    }
  }

  private async dispatchDue(url: string, secret: string): Promise<void> {
    if (this.sending) return;
    this.sending = true;
    try {
      const now = new Date();
      const events = await this.prisma.automationEventModel.findMany({
        where: {
          deliveredAt: null,
          nextAttemptAt: { lte: now },
          OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
        },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });
      for (const event of events) {
        const claimed = await this.prisma.automationEventModel.updateMany({
          where: {
            id: event.id,
            deliveredAt: null,
            nextAttemptAt: { lte: now },
            OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
          },
          data: { lockedUntil: new Date(Date.now() + 120_000) },
        });
        if (claimed.count !== 1) continue;
        await this.deliver(event, url, secret);
      }
    } catch (error) {
      this.logger.error(
        `Falha ao processar fila de eventos: ${error instanceof Error ? error.name : 'Erro'}`,
      );
    } finally {
      this.sending = false;
    }
  }

  private async deliver(
    event: {
      id: string;
      type: string;
      aggregateId: string;
      payload: unknown;
      createdAt: Date;
      attempts: number;
    },
    url: string,
    secret: string,
  ): Promise<void> {
    const body = JSON.stringify({
      id: event.id,
      type: event.type,
      aggregateId: event.aggregateId,
      payload: event.payload,
      createdAt: event.createdAt.toISOString(),
    });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac('sha256', secret)
      .update(`${timestamp}.${body}`)
      .digest('hex');
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-lari-event-id': event.id,
          'x-lari-timestamp': timestamp,
          'x-lari-signature': `sha256=${signature}`,
          'x-lari-webhook-key': secret,
        },
        body,
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await this.prisma.automationEventModel.update({
        where: { id: event.id },
        data: { deliveredAt: new Date(), lockedUntil: null, lastError: null },
      });
    } catch (error) {
      const attempts = event.attempts + 1;
      const delay = Math.min(
        30_000 * 2 ** Math.min(attempts - 1, 7),
        3_600_000,
      );
      await this.prisma.automationEventModel.update({
        where: { id: event.id },
        data: {
          attempts: { increment: 1 },
          nextAttemptAt: new Date(Date.now() + delay),
          lockedUntil: null,
          lastError:
            error instanceof Error
              ? error.message.slice(0, 500)
              : 'Falha de entrega',
        },
      });
    }
  }
}
