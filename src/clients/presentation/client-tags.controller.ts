import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Roles } from '../../infra/security/decorators/roles.decorator';
import { ClientTagRepository } from '../infra/client-tag.repository';

class CreateClientTagDto {
  @IsString() @IsNotEmpty() @MaxLength(40) name!: string;
}

@Controller('client-tags')
export class ClientTagsController {
  constructor(private readonly tags: ClientTagRepository) {}
  @Get() list() { return this.tags.list(); }
  @Roles('admin') @Post() create(@Body() body: CreateClientTagDto) { return this.tags.create(body.name); }
  @Roles('admin') @Delete(':name') delete(@Param('name') name: string) { return this.tags.delete(name); }
}
