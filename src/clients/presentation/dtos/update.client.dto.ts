import { IsString, MaxLength, IsOptional, IsInt, Min, IsArray, ArrayMaxSize, ArrayUnique, Matches } from 'class-validator';

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'O nome deve ter no máximo 120 caracteres' })
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'O telefone deve ter no máximo 20 caracteres' })
  telefone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'O status deve ter no máximo 20 caracteres' })
  status?: string;

  @IsOptional()
  @IsInt({ message: 'O total de faltas deve ser um número inteiro' })
  @Min(0, { message: 'O total de faltas não pode ser negativo' })
  totalFaltas?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @Matches(/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])$/)
  birthday?: string | null;
}
