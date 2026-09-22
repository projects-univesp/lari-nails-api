import { IsUUID, IsNotEmpty } from 'class-validator';

export class IdClientDto {
  @IsUUID('4', { message: 'O ID deve ser um UUID válido' })
  @IsNotEmpty({ message: 'O ID é obrigatório' })
  id!: string;
}
