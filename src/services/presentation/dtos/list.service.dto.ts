import { IsIn, IsOptional } from 'class-validator';

export class ListServiceDto {
  @IsOptional()
  @IsIn(['true', 'false'])
  active?: 'true' | 'false';
}
