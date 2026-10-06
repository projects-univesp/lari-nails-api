import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class DayHoursDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsBoolean()
  isOpen!: boolean;

  @ValidateIf((_, value: unknown) => value !== null && value !== undefined)
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  openTime?: string | null;

  @ValidateIf((_, value: unknown) => value !== null && value !== undefined)
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  closeTime?: string | null;

  @ValidateIf((_, value: unknown) => value !== null && value !== undefined)
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  lunchStart?: string | null;

  @ValidateIf((_, value: unknown) => value !== null && value !== undefined)
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  lunchEnd?: string | null;
}

export class ReplaceBusinessHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayHoursDto)
  days!: DayHoursDto[];
}
