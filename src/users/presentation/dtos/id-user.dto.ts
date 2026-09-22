import { IsUUID } from 'class-validator';

export class IdUserDto {
  @IsUUID('4', { message: 'O ID informado deve ser um UUID v4 válido' })
  id!: string;
}
