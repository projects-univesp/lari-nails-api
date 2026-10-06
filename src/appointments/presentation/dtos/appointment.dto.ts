import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateAppointmentDto {
  @IsUUID('4')
  clientId!: string;

  @IsUUID('4')
  serviceId!: string;

  @Matches(DATE)
  requestedDate!: string;

  @Matches(TIME)
  requestedTime!: string;

  @IsIn(['MANUAL', 'WHATSAPP_BOT'])
  source!: 'MANUAL' | 'WHATSAPP_BOT';
}

export class ListAppointmentsDto {
  @Matches(DATE)
  from!: string;

  @Matches(DATE)
  to!: string;

  @IsOptional()
  @IsIn(['AGUARDANDO', 'CONFIRMADO', 'REAGENDAMENTO_SUGERIDO', 'CANCELADO'])
  status?: 'AGUARDANDO' | 'CONFIRMADO' | 'REAGENDAMENTO_SUGERIDO' | 'CANCELADO';
}

export class IdAppointmentDto {
  @IsUUID('4')
  id!: string;
}

export class DecideAppointmentDto {
  @IsIn(['CONFIRMADO', 'REAGENDAMENTO_SUGERIDO', 'CANCELADO'])
  status!: 'CONFIRMADO' | 'REAGENDAMENTO_SUGERIDO' | 'CANCELADO';

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @Matches(DATE)
  proposedDate?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @Matches(TIME)
  proposedTime?: string;
}
