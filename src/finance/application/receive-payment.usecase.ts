import {
  FinanceTransaction,
  IFinanceRepository,
} from '../domain/finance.repository.interface';
import { PaymentMethod } from '../domain/payment.entity';

export class ReceivePaymentUseCase {
  constructor(private readonly repository: IFinanceRepository) {}

  async execute(id: string, method: PaymentMethod): Promise<FinanceTransaction> {
    return this.repository.markAsReceived(id, method);
  }
}
