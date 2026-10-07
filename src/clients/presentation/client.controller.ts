/* eslint-disable @typescript-eslint/unbound-method */
import {
  Controller,
  Post,
  Body,
  Get,
  UseFilters,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { CreateClientUseCase } from '../application/create.client.usecase';
import { FindAllClientUseCase } from '../application/find-all.client.usecase';
import { FindClientUseCase } from '../application/find.client.usecase';
import { DeleteClientUseCase } from '../application/delete.client.usecase';
import { UpdateClientUseCase } from '../application/update.client.usecase';
import { RestoreClientUseCase } from '../application/restore.client.usecase';
import { CreateClientDto } from './dtos/create.client.dto';
import { UpdateClientDto } from './dtos/update.client.dto';
import { IdClientDto } from './dtos/id.client.dto';
import { ClientPresenter } from './presenters/clients.presenter';
import { DomainExceptionFilter } from './filters/client.domain.filter';
import { FindClientHistoryUseCase } from '../application/find-client-history.usecase';

@Controller('clients')
@UseFilters(DomainExceptionFilter)
export class ClientController {
  constructor(
    private readonly createUseCase: CreateClientUseCase,
    private readonly findAllUseCase: FindAllClientUseCase,
    private readonly findUseCase: FindClientUseCase,
    private readonly deleteUseCase: DeleteClientUseCase,
    private readonly updateUseCase: UpdateClientUseCase,
    private readonly restoreUseCase: RestoreClientUseCase,
    private readonly historyUseCase: FindClientHistoryUseCase,
  ) {}

  @Post()
  async create(@Body() body: CreateClientDto) {
    await this.createUseCase.execute(
      body.nome,
      body.telefone,
      body.status,
      body.totalFaltas,
      body.tags,
      body.birthday,
    );
    return { message: 'Cliente criado com sucesso' };
  }

  @Get()
  async findAll() {
    const clients = await this.findAllUseCase.execute();
    return clients.map(ClientPresenter.toHTTP);
  }

  @Get(':id')
  async findById(@Param() params: IdClientDto) {
    const client = await this.findUseCase.execute(params.id);
    return client ? ClientPresenter.toHTTP(client) : null;
  }

  @Get(':id/history')
  history(@Param() params: IdClientDto) {
    return this.historyUseCase.execute(params.id);
  }

  @Patch(':id')
  async update(@Param() params: IdClientDto, @Body() body: UpdateClientDto) {
    const client = await this.updateUseCase.execute({
      id: params.id,
      ...body,
      birthday: body.birthday,
    });
    return {
      message: 'Cliente atualizado com sucesso',
      client: ClientPresenter.toHTTP(client),
    };
  }

  @Patch(':id/restore')
  async restore(@Param() params: IdClientDto) {
    const client = await this.restoreUseCase.execute(params.id);
    return {
      message: 'Cliente reativado com sucesso',
      client: ClientPresenter.toHTTP(client),
    };
  }

  @Delete(':id')
  async delete(@Param() params: IdClientDto) {
    await this.deleteUseCase.execute(params.id);
    return { message: 'Cliente deletado com sucesso' };
  }
}
