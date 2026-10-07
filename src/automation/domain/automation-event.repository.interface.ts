import { AutomationEvent } from './automation-event.entity';

/** Evento pendente na fila de entrega, com metadados de retry. */
export interface PendingAutomationEvent {
  id: string;
  type: string;
  aggregateId: string;
  payload: unknown;
  createdAt: Date;
  attempts: number;
}

/**
 * Porta de saída do módulo de automação. A aplicação e o processo de entrega
 * dependem desta interface; a implementação Prisma vive na infraestrutura.
 */
export interface IAutomationEventRepository {
  /** Busca um evento pelo id para verificação de assinatura. */
  findById(id: string): Promise<AutomationEvent | null>;

  /** Lista eventos elegíveis para entrega (não entregues, no prazo, destravados). */
  findDue(now: Date, limit: number): Promise<PendingAutomationEvent[]>;

  /** Tenta reservar o evento para entrega; retorna true se conseguiu o lock. */
  claim(id: string, now: Date, lockUntil: Date): Promise<boolean>;

  /** Marca o evento como entregue com sucesso. */
  markDelivered(id: string): Promise<void>;

  /** Registra falha de entrega e agenda nova tentativa. */
  markFailed(id: string, nextAttemptAt: Date, lastError: string): Promise<void>;
}
