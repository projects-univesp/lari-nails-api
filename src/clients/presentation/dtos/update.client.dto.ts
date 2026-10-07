import {
  IsString,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  IsEmail,
  IsDateString,
} from 'class-validator';

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
  @IsEmail({}, { message: 'O e-mail deve ser válido' })
  @MaxLength(255, { message: 'O e-mail deve ter no máximo 255 caracteres' })
  email?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'A data de nascimento deve ser uma data válida' },
  )
  dataNasc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'O status deve ter no máximo 20 caracteres' })
  status?: string;

  @IsOptional()
  @IsInt({ message: 'O total de faltas deve ser um número inteiro' })
  @Min(0, { message: 'O total de faltas não pode ser negativo' })
  totalFaltas?: number;
}
