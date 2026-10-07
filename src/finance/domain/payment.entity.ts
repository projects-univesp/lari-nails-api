import { randomUUID } from 'crypto';

export class PaymentValidationError extends Error {}

export const PAYMENT_STATUSES = ['PENDENTE', 'RECEBIDO'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ['PIX', 'CARTAO', 'DINHEIRO'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface PaymentData {
  appointmentId: string;
  amountCents: number;
  status: PaymentStatus;
  method?: PaymentMethod | null;
  paidAt?: Date | null;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entidade de domínio que representa um pagamento de atendimento.
 * Concentra as regras invariantes: valor não negativo, método obrigatório
 * quando recebido e ausente quando pendente, e consistência de paidAt.
 */
export class Payment {
  readonly id: string;
  readonly appointmentId: string;
  readonly amountCents: number;
  readonly status: PaymentStatus;
  readonly method: PaymentMethod | null;
  readonly paidAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: PaymentData) {
    this.id = data.id ?? randomUUID();
    this.appointmentId = data.appointmentId;
    this.amountCents = data.amountCents;
    this.status = data.status;
    this.method = data.status === 'RECEBIDO' ? (data.method ?? null) : null;
    this.paidAt =
      data.paidAt ?? (data.status === 'RECEBIDO' ? new Date() : null);
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
    this.validate();
  }

  /**
   * Cria um novo pagamento no ato do checkout de um atendimento.
   */
  static createForCheckout(
    appointmentId: string,
    amountCents: number,
    status: PaymentStatus,
    method?: PaymentMethod | null,
  ): Payment {
    return new Payment({ appointmentId, amountCents, status, method });
  }

  get isReceived(): boolean {
    return this.status === 'RECEBIDO';
  }

  private validate(): void {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        this.id,
      )
    ) {
      throw new PaymentValidationError('ID de pagamento inválido');
    }
    if (!this.appointmentId || typeof this.appointmentId !== 'string') {
      throw new PaymentValidationError('Agendamento inválido');
    }
    if (
      !Number.isSafeInteger(this.amountCents) ||
      this.amountCents < 0 ||
      this.amountCents > 2147483647
    ) {
      throw new PaymentValidationError('Valor em centavos inválido');
    }
    if (!PAYMENT_STATUSES.includes(this.status)) {
      throw new PaymentValidationError('Status de pagamento inválido');
    }
    if (this.status === 'RECEBIDO' && this.method === null) {
      throw new PaymentValidationError('Informe a forma de pagamento');
    }
    if (this.method !== null && !PAYMENT_METHODS.includes(this.method)) {
      throw new PaymentValidationError('Forma de pagamento inválida');
    }
  }
}
