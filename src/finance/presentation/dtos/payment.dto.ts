import { IsIn, IsInt, IsUUID, Matches, Min, ValidateIf } from 'class-validator';
import { PAYMENT_METHODS } from '../../domain/payment.entity';
import type {
  PaymentMethod,
  PaymentStatus,
} from '../../domain/payment.entity';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class FinanceDateRangeDto {
  @Matches(DATE) from!: string;
  @Matches(DATE) to!: string;
}

export class CheckoutAppointmentDto {
  @IsInt() @Min(0) amountCents!: number;

  @IsIn(['PENDENTE', 'RECEBIDO']) status!: PaymentStatus;

  @ValidateIf((input: CheckoutAppointmentDto) => input.status === 'RECEBIDO')
  @IsIn(PAYMENT_METHODS)
  method?: PaymentMethod;
}

export class ReceivePaymentDto {
  @IsIn(PAYMENT_METHODS) method!: PaymentMethod;
}

export class IdPaymentDto {
  @IsUUID('4') id!: string;
}

export class IdPaymentAppointmentDto {
  @IsUUID('4') appointmentId!: string;
}
