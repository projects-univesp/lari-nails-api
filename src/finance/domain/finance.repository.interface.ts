import { Payment, PaymentMethod, PaymentStatus } from './payment.entity';

/**
 * Modelo de leitura de uma transação financeira, já enriquecido com dados
 * do atendimento, cliente e serviço, pronto para a camada de apresentação.
 */
export interface FinanceTransaction {
  id: string;
  appointmentId: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  amountCents: number;
  status: PaymentStatus;
  method: PaymentMethod | null;
  appointmentDate: string;
  appointmentTime: string;
  date: string;
  paidAt: string | null;
}

/**
 * Porta de saída do módulo financeiro. A camada de aplicação depende
 * exclusivamente desta interface; a implementação concreta (Prisma) vive
 * na camada de infraestrutura.
 */
export interface IFinanceRepository {
  /**
   * Conclui o atendimento confirmado e registra o pagamento, o evento de
   * histórico e o evento de automação na mesma transação, devolvendo a
   * transação financeira resultante.
   */
  registerCheckout(
    payment: Payment,
    actorId: string,
  ): Promise<FinanceTransaction>;

  /** Lista transações (recebidas por paidAt, pendentes por createdAt) no período. */
  listByPeriod(start: Date, end: Date): Promise<FinanceTransaction[]>;

  /** Marca um pagamento pendente como recebido com a forma informada. */
  markAsReceived(
    id: string,
    method: PaymentMethod,
  ): Promise<FinanceTransaction>;
}
