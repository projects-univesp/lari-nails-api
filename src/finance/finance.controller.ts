import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseFilters } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../infra/security/decorators/roles.decorator';
import { FinanceRepository } from './finance.repository';
import { CompleteAppointmentDto, FinanceDateRangeDto, IdPaymentAppointmentDto, IdPaymentDto, ReceivePaymentDto } from './payment.dto';

@Controller('finance')
@Roles('admin')
export class FinanceController {
  constructor(private readonly finance: FinanceRepository) {}

  @Get('transactions')
  list(@Query() query: FinanceDateRangeDto) { return this.finance.list(query.from, query.to); }

  @Post('appointments/:appointmentId/checkout')
  checkout(@Param() params: IdPaymentAppointmentDto, @Body() body: CompleteAppointmentDto, @Req() request: Request) {
    const user = request.user as { sub: string };
    return this.finance.checkout(params.appointmentId, body, user.sub);
  }

  @Patch('transactions/:id/receive')
  receive(@Param() params: IdPaymentDto, @Body() body: ReceivePaymentDto) { return this.finance.receive(params.id, body.method); }
}
