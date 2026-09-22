import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(120, { message: 'O nome deve ter no máximo 120 caracteres' })
  nome!: string;

  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  @MaxLength(180, { message: 'O e-mail deve ter no máximo 180 caracteres' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  senha!: string;

  @IsOptional()
  @IsString()
  @IsIn(['admin', 'colaborador'], {
    message: 'O perfil deve ser admin ou colaborador',
  })
  role?: string;
}
