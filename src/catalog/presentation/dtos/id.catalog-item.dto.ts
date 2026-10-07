import { IsUUID } from 'class-validator';

export class IdServiceDto {
  @IsUUID('4')
  id!: string;
}
