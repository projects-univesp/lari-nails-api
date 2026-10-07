import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infra/database/database.module';
import { CreateCatalogItemUseCase } from './application/create.catalog-item.usecase';
import { FindAllCatalogItemUseCase } from './application/find-all.catalog-item.usecase';
import { FindCatalogItemUseCase } from './application/find.catalog-item.usecase';
import { UpdateCatalogItemUseCase } from './application/update.catalog-item.usecase';
import { ICatalogRepository } from './domain/catalog.repository.interface';
import { PrismaCatalogRepository } from './infra/prisma.catalog.repository';
import { CatalogItemController } from './presentation/catalog-item.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [CatalogItemController],
  providers: [
    { provide: 'ICatalogRepository', useClass: PrismaCatalogRepository },
    {
      provide: CreateCatalogItemUseCase,
      useFactory: (repo: ICatalogRepository) =>
        new CreateCatalogItemUseCase(repo),
      inject: ['ICatalogRepository'],
    },
    {
      provide: FindAllCatalogItemUseCase,
      useFactory: (repo: ICatalogRepository) =>
        new FindAllCatalogItemUseCase(repo),
      inject: ['ICatalogRepository'],
    },
    {
      provide: FindCatalogItemUseCase,
      useFactory: (repo: ICatalogRepository) =>
        new FindCatalogItemUseCase(repo),
      inject: ['ICatalogRepository'],
    },
    {
      provide: UpdateCatalogItemUseCase,
      useFactory: (repo: ICatalogRepository) =>
        new UpdateCatalogItemUseCase(repo),
      inject: ['ICatalogRepository'],
    },
  ],
  exports: [FindCatalogItemUseCase, FindAllCatalogItemUseCase],
})
export class CatalogModule {}
