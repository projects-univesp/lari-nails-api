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
import { CreateCatalogItemUseCase } from '../application/create.catalog-item.usecase';
import { FindAllCatalogItemUseCase } from '../application/find-all.catalog-item.usecase';
import { FindCatalogItemUseCase } from '../application/find.catalog-item.usecase';
import { UpdateCatalogItemUseCase } from '../application/update.catalog-item.usecase';
import { CreateServiceDto } from './dtos/create.catalog-item.dto';
import { IdServiceDto } from './dtos/id.catalog-item.dto';
import { ListServiceDto } from './dtos/list.catalog-item.dto';
import { UpdateServiceDto } from './dtos/update.catalog-item.dto';
import { CatalogItemDomainFilter } from './filters/catalog-item.domain.filter';
import { CatalogItemPresenter } from './presenters/catalog-item.presenter';

@Controller('catalog')
@UseFilters(CatalogItemDomainFilter)
export class CatalogItemController {
  constructor(
    private readonly createUseCase: CreateCatalogItemUseCase,
    private readonly findAllUseCase: FindAllCatalogItemUseCase,
    private readonly findUseCase: FindCatalogItemUseCase,
    private readonly updateUseCase: UpdateCatalogItemUseCase,
  ) {}

  @Roles('admin')
  @Post()
  async create(@Body() body: CreateServiceDto) {
    return CatalogItemPresenter.toHTTP(await this.createUseCase.execute(body));
  }

  @Get()
  async findAll(@Query() query: ListServiceDto) {
    const active =
      query.active === undefined ? undefined : query.active === 'true';
    const services = await this.findAllUseCase.execute(active);
    return services.map((service) => CatalogItemPresenter.toHTTP(service));
  }

  @Get(':id')
  async findById(@Param() params: IdServiceDto) {
    return CatalogItemPresenter.toHTTP(await this.findUseCase.execute(params.id));
  }

  @Roles('admin')
  @Patch(':id')
  async update(@Param() params: IdServiceDto, @Body() body: UpdateServiceDto) {
    return CatalogItemPresenter.toHTTP(
      await this.updateUseCase.execute(params.id, body),
    );
  }
}
