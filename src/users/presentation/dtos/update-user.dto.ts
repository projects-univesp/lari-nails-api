import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'O nome deve ter no máximo 120 caracteres' })
  nome?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  senha?: string;

  @IsOptional()
  @IsString()
  @IsIn(['admin', 'colaborador'], {
    message: 'O perfil deve ser admin ou colaborador',
  })
  role?: string;
}
