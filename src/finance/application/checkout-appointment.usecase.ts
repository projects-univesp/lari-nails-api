import {
  FinanceTransaction,
  IFinanceRepository,
} from '../domain/finance.repository.interface';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../domain/payment.entity';

export interface CheckoutInput {
  amountCents: number;
  status: PaymentStatus;
  method?: PaymentMethod | null;
}

export class CheckoutAppointmentUseCase {
  constructor(private readonly repository: IFinanceRepository) {}

  async execute(
    appointmentId: string,
    input: CheckoutInput,
    actorId: string,
  ): Promise<FinanceTransaction> {
    const payment = Payment.createForCheckout(
      appointmentId,
      input.amountCents,
      input.status,
      input.method,
    );
    return this.repository.registerCheckout(payment, actorId);
  }
}
