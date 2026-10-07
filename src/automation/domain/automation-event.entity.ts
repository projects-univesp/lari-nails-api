import { createHmac, timingSafeEqual } from 'crypto';
import {
  AutomationUnauthorizedError,
} from './automation.errors';

export interface AutomationEventData {
  id: string;
  type: string;
  aggregateId: string;
  payload: unknown;
  createdAt: Date;
}

/** Payload canônico assinado/entregue (ordem de campos é significativa). */
export interface CanonicalAutomationEvent {
  id: string;
  type: string;
  aggregateId: string;
  payload: unknown;
  createdAt: string;
}

const SIGNATURE_PREFIX = 'sha256=';
const MAX_AGE_SECONDS = 300;

/**
 * Entidade de domínio do evento de automação. Concentra as regras de
 * canonicalização e verificação de assinatura HMAC e prazo, sem dependência
 * de framework ou banco.
 */
export class AutomationEvent {
  readonly id: string;
  readonly type: string;
  readonly aggregateId: string;
  readonly payload: unknown;
  readonly createdAt: Date;

  constructor(data: AutomationEventData) {
    this.id = data.id;
    this.type = data.type;
    this.aggregateId = data.aggregateId;
    this.payload = data.payload;
    this.createdAt = data.createdAt;
  }

  toCanonical(): CanonicalAutomationEvent {
    return {
      id: this.id,
      type: this.type,
      aggregateId: this.aggregateId,
      payload: this.payload,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /**
   * Verifica a assinatura HMAC-SHA256 de `timestamp.corpoCanônico` e o prazo
   * do evento. Lança AutomationUnauthorizedError em caso de prazo expirado ou
   * assinatura inválida. Retorna o payload canônico quando válido.
   */
  verifySignature(
    timestamp: string,
    signature: string,
    secret: string,
  ): CanonicalAutomationEvent {
    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(age) || age > MAX_AGE_SECONDS) {
      throw new AutomationUnauthorizedError('Evento expirado');
    }

    const canonical = this.toCanonical();
    const expected = createHmac('sha256', secret)
      .update(`${timestamp}.${JSON.stringify(canonical)}`)
      .digest('hex');
    const provided = signature.startsWith(SIGNATURE_PREFIX)
      ? signature.slice(SIGNATURE_PREFIX.length)
      : signature;

    const expectedBuffer = Buffer.from(expected, 'hex');
    const providedBuffer = Buffer.from(provided, 'hex');
    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      throw new AutomationUnauthorizedError('Assinatura inválida');
    }

    return canonical;
  }
}
