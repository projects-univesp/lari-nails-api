import { IsIn, IsInt, IsOptional, IsUUID, Matches, Min, ValidateIf } from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const PAYMENT_METHODS = ['PIX', 'CARTAO', 'DINHEIRO'] as const;

export class FinanceDateRangeDto {
  @Matches(DATE) from!: string;
  @Matches(DATE) to!: string;
}

export class CompleteAppointmentDto {
  @IsInt() @Min(0) amountCents!: number;
  @IsIn(['PENDENTE', 'RECEBIDO']) status!: 'PENDENTE' | 'RECEBIDO';
  @ValidateIf((input: CompleteAppointmentDto) => input.status === 'RECEBIDO')
  @IsIn(PAYMENT_METHODS)
  method?: (typeof PAYMENT_METHODS)[number];
}

export class ReceivePaymentDto {
  @IsIn(PAYMENT_METHODS) method!: (typeof PAYMENT_METHODS)[number];
}

export class IdPaymentDto {
  @IsUUID('4') id!: string;
}

export class IdPaymentAppointmentDto {
  @IsUUID('4') appointmentId!: string;
}
