import {
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export class DateRangeDto {
  @Matches(DATE)
  from!: string;

  @Matches(DATE)
  to!: string;
}

export class AvailabilityQueryDto extends DateRangeDto {
  @IsUUID('4')
  serviceId!: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsUUID('4')
  excludeAppointmentId?: string;
}

export class IdAgendaBlockDto {
  @IsUUID('4')
  id!: string;
}

export class CreateAgendaBlockDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  reason!: string;

  @Matches(DATE)
  date!: string;

  @Matches(TIME)
  startTime!: string;

  @Matches(TIME)
  endTime!: string;
}

export class UpdateAgendaBlockDto {
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  reason?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @Matches(DATE)
  date?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @Matches(TIME)
  startTime?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @Matches(TIME)
  endTime?: string;
}
