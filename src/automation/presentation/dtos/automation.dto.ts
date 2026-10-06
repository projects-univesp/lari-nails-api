import {
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class ResolveAutomationClientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  telefone!: string;
}

export class CreateAutomationAppointmentDto {
  @IsUUID('4')
  clientId!: string;

  @IsUUID('4')
  serviceId!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  requestedDate!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  requestedTime!: string;
}

export class VerifyAutomationEventDto {
  @IsUUID('4')
  id!: string;

  @Matches(/^\d{10}$/)
  timestamp!: string;

  @Matches(/^sha256=[a-f0-9]{64}$/)
  signature!: string;
}
