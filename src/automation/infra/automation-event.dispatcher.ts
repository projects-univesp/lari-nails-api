import { createHmac } from 'crypto';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type {
  IAutomationEventRepository,
  PendingAutomationEvent,
} from '../domain/automation-event.repository.interface';

const POLL_INTERVAL_MS = 30_000;
const LOCK_MS = 120_000;
const BATCH_SIZE = 20;
const MAX_BACKOFF_MS = 3_600_000;
const DELIVERY_TIMEOUT_MS = 10_000;

/**
 * Processo de entrega de eventos de automação por webhook. Mantém a política de
 * entrega (assinatura, retry com backoff exponencial) e delega toda a
 * persistência à porta IAutomationEventRepository.
 */
@Injectable()
export class AutomationEventDispatcher
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AutomationEventDispatcher.name);
  private timer?: NodeJS.Timeout;
  private sending = false;

  constructor(
    @Inject('IAutomationEventRepository')
    private readonly repository: IAutomationEventRepository,
  ) {}

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
    }, POLL_INTERVAL_MS);
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
      const events = await this.repository.findDue(now, BATCH_SIZE);
      for (const event of events) {
        const claimed = await this.repository.claim(
          event.id,
          now,
          new Date(Date.now() + LOCK_MS),
        );
        if (!claimed) continue;
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
    event: PendingAutomationEvent,
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
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await this.repository.markDelivered(event.id);
    } catch (error) {
      const attempts = event.attempts + 1;
      const delay = Math.min(
        POLL_INTERVAL_MS * 2 ** Math.min(attempts - 1, 7),
        MAX_BACKOFF_MS,
      );
      await this.repository.markFailed(
        event.id,
        new Date(Date.now() + delay),
        error instanceof Error ? error.message : 'Falha de entrega',
      );
    }
  }
}
