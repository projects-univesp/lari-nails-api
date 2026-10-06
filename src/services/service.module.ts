import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infra/database/database.module';
import { CreateServiceUseCase } from './application/create.service.usecase';
import { FindAllServiceUseCase } from './application/find-all.service.usecase';
import { FindServiceUseCase } from './application/find.service.usecase';
import { UpdateServiceUseCase } from './application/update.service.usecase';
import { IServiceRepository } from './domain/service.repository.interface';
import { PrismaServiceRepository } from './infra/prisma.service.repository';
import { ServiceController } from './presentation/service.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ServiceController],
  providers: [
    { provide: 'IServiceRepository', useClass: PrismaServiceRepository },
    {
      provide: CreateServiceUseCase,
      useFactory: (repo: IServiceRepository) => new CreateServiceUseCase(repo),
      inject: ['IServiceRepository'],
    },
    {
      provide: FindAllServiceUseCase,
      useFactory: (repo: IServiceRepository) => new FindAllServiceUseCase(repo),
      inject: ['IServiceRepository'],
    },
    {
      provide: FindServiceUseCase,
      useFactory: (repo: IServiceRepository) => new FindServiceUseCase(repo),
      inject: ['IServiceRepository'],
    },
    {
      provide: UpdateServiceUseCase,
      useFactory: (repo: IServiceRepository) => new UpdateServiceUseCase(repo),
      inject: ['IServiceRepository'],
    },
  ],
  exports: [FindServiceUseCase, FindAllServiceUseCase],
})
export class ServiceModule {}
