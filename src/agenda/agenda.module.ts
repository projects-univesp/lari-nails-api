import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infra/database/database.module';
import { FindServiceUseCase } from '../services/application/find.service.usecase';
import { ServiceModule } from '../services/service.module';
import { AgendaBlockUseCase } from './application/agenda-block.usecase';
import { BusinessHoursUseCase } from './application/business-hours.usecase';
import { FindAvailabilityUseCase } from './application/find-availability.usecase';
import { IAgendaRepository } from './domain/agenda.repository.interface';
import { PrismaAgendaRepository } from './infra/prisma.agenda.repository';
import { AgendaController } from './presentation/agenda.controller';

@Module({
  imports: [DatabaseModule, ServiceModule],
  controllers: [AgendaController],
  providers: [
    { provide: 'IAgendaRepository', useClass: PrismaAgendaRepository },
    {
      provide: BusinessHoursUseCase,
      useFactory: (repo: IAgendaRepository) => new BusinessHoursUseCase(repo),
      inject: ['IAgendaRepository'],
    },
    {
      provide: AgendaBlockUseCase,
      useFactory: (repo: IAgendaRepository) => new AgendaBlockUseCase(repo),
      inject: ['IAgendaRepository'],
    },
    {
      provide: FindAvailabilityUseCase,
      useFactory: (repo: IAgendaRepository, service: FindServiceUseCase) =>
        new FindAvailabilityUseCase(repo, service),
      inject: ['IAgendaRepository', FindServiceUseCase],
    },
  ],
  exports: [FindAvailabilityUseCase, BusinessHoursUseCase],
})
export class AgendaModule {}
