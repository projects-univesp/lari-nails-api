import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { Roles } from '../../infra/security/decorators/roles.decorator';
import { CreateServiceUseCase } from '../application/create.service.usecase';
import { FindAllServiceUseCase } from '../application/find-all.service.usecase';
import { FindServiceUseCase } from '../application/find.service.usecase';
import { UpdateServiceUseCase } from '../application/update.service.usecase';
import { CreateServiceDto } from './dtos/create.service.dto';
import { IdServiceDto } from './dtos/id.service.dto';
import { ListServiceDto } from './dtos/list.service.dto';
import { UpdateServiceDto } from './dtos/update.service.dto';
import { ServiceDomainFilter } from './filters/service.domain.filter';
import { ServicePresenter } from './presenters/service.presenter';

@Controller('services')
@UseFilters(ServiceDomainFilter)
export class ServiceController {
  constructor(
    private readonly createUseCase: CreateServiceUseCase,
    private readonly findAllUseCase: FindAllServiceUseCase,
    private readonly findUseCase: FindServiceUseCase,
    private readonly updateUseCase: UpdateServiceUseCase,
  ) {}

  @Roles('admin')
  @Post()
  async create(@Body() body: CreateServiceDto) {
    return ServicePresenter.toHTTP(await this.createUseCase.execute(body));
  }

  @Get()
  async findAll(@Query() query: ListServiceDto) {
    const active =
      query.active === undefined ? undefined : query.active === 'true';
    const services = await this.findAllUseCase.execute(active);
    return services.map((service) => ServicePresenter.toHTTP(service));
  }

  @Get(':id')
  async findById(@Param() params: IdServiceDto) {
    return ServicePresenter.toHTTP(await this.findUseCase.execute(params.id));
  }

  @Roles('admin')
  @Patch(':id')
  async update(@Param() params: IdServiceDto, @Body() body: UpdateServiceDto) {
    return ServicePresenter.toHTTP(
      await this.updateUseCase.execute(params.id, body),
    );
  }
}
