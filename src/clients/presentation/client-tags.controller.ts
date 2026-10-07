import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Roles } from '../../infra/security/decorators/roles.decorator';
import {
  CreateClientTagUseCase,
  DeleteClientTagUseCase,
  ListClientTagsUseCase,
} from '../application/client-tag.usecase';
import { CreateClientTagDto } from './dtos/create-client-tag.dto';

@Controller('client-tags')
export class ClientTagsController {
  constructor(
    private readonly listUseCase: ListClientTagsUseCase,
    private readonly createUseCase: CreateClientTagUseCase,
    private readonly deleteUseCase: DeleteClientTagUseCase,
  ) {}

  @Get()
  list() {
    return this.listUseCase.execute();
  }

  @Roles('admin')
  @Post()
  create(@Body() body: CreateClientTagDto) {
    return this.createUseCase.execute(body.name);
  }

  @Roles('admin')
  @Delete(':name')
  delete(@Param('name') name: string) {
    return this.deleteUseCase.execute(name);
  }
}
