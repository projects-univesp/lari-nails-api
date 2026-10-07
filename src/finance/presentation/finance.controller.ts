import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseFilters,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../infra/security/decorators/roles.decorator';
import { CheckoutAppointmentUseCase } from '../application/checkout-appointment.usecase';
import { ListTransactionsUseCase } from '../application/list-transactions.usecase';
import { ReceivePaymentUseCase } from '../application/receive-payment.usecase';
import {
  CheckoutAppointmentDto,
  FinanceDateRangeDto,
  IdPaymentAppointmentDto,
  IdPaymentDto,
  ReceivePaymentDto,
} from './dtos/payment.dto';
import { FinanceDomainFilter } from './filters/finance.domain.filter';
import { TransactionPresenter } from './presenters/transaction.presenter';

@Controller('finance')
@Roles('admin')
@UseFilters(FinanceDomainFilter)
export class FinanceController {
  constructor(
    private readonly checkoutUseCase: CheckoutAppointmentUseCase,
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
    private readonly receivePaymentUseCase: ReceivePaymentUseCase,
  ) {}

  @Get('transactions')
  async list(@Query() query: FinanceDateRangeDto) {
    const transactions = await this.listTransactionsUseCase.execute(
      query.from,
      query.to,
    );
    return transactions.map((transaction) =>
      TransactionPresenter.toHTTP(transaction),
    );
  }

  @Post('appointments/:appointmentId/checkout')
  async checkout(
    @Param() params: IdPaymentAppointmentDto,
    @Body() body: CheckoutAppointmentDto,
    @Req() request: Request,
  ) {
    const user = request.user as { sub: string };
    const transaction = await this.checkoutUseCase.execute(
      params.appointmentId,
      body,
      user.sub,
    );
    return TransactionPresenter.toHTTP(transaction);
  }

  @Patch('transactions/:id/receive')
  async receive(
    @Param() params: IdPaymentDto,
    @Body() body: ReceivePaymentDto,
  ) {
    const transaction = await this.receivePaymentUseCase.execute(
      params.id,
      body.method,
    );
    return TransactionPresenter.toHTTP(transaction);
  }
}
