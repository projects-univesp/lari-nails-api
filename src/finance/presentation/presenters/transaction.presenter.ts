import { FinanceTransaction } from '../../domain/finance.repository.interface';

export class TransactionPresenter {
  static toHTTP(transaction: FinanceTransaction) {
    return {
      id: transaction.id,
      appointmentId: transaction.appointmentId,
      clientId: transaction.clientId,
      clientName: transaction.clientName,
      serviceName: transaction.serviceName,
      amountCents: transaction.amountCents,
      status: transaction.status,
      method: transaction.method,
      appointmentDate: transaction.appointmentDate,
      appointmentTime: transaction.appointmentTime,
      date: transaction.date,
      paidAt: transaction.paidAt,
    };
  }
}
