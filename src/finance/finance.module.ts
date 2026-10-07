import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infra/database/database.module';
import { CheckoutAppointmentUseCase } from './application/checkout-appointment.usecase';
import { ListTransactionsUseCase } from './application/list-transactions.usecase';
import { ReceivePaymentUseCase } from './application/receive-payment.usecase';
import { IFinanceRepository } from './domain/finance.repository.interface';
import { PrismaFinanceRepository } from './infra/prisma.finance.repository';
import { FinanceController } from './presentation/finance.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [FinanceController],
  providers: [
    { provide: 'IFinanceRepository', useClass: PrismaFinanceRepository },
    {
      provide: CheckoutAppointmentUseCase,
      useFactory: (repo: IFinanceRepository) =>
        new CheckoutAppointmentUseCase(repo),
      inject: ['IFinanceRepository'],
    },
    {
      provide: ListTransactionsUseCase,
      useFactory: (repo: IFinanceRepository) =>
        new ListTransactionsUseCase(repo),
      inject: ['IFinanceRepository'],
    },
    {
      provide: ReceivePaymentUseCase,
      useFactory: (repo: IFinanceRepository) => new ReceivePaymentUseCase(repo),
      inject: ['IFinanceRepository'],
    },
  ],
})
export class FinanceModule {}
