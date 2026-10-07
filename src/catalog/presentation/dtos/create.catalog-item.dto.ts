import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsInt()
  @Min(0)
  @Max(2147483647)
  priceCents!: number;

  @IsInt()
  @Min(1)
  @Max(1440)
  durationMinutes!: number;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsBoolean()
  active?: boolean;
}
