import { Module } from '@nestjs/common';
import { AgendaModule } from '../agenda/agenda.module';
import { AppointmentModule } from '../appointments/appointment.module';
import { ClientModule } from '../clients/client.module';
import { CatalogModule } from '../catalog/catalog.module';
import { DatabaseModule } from '../infra/database/database.module';
import { VerifyAutomationEventUseCase } from './application/verify-automation-event.usecase';
import { IAutomationEventRepository } from './domain/automation-event.repository.interface';
import { AutomationEventDispatcher } from './infra/automation-event.dispatcher';
import { PrismaAutomationEventRepository } from './infra/prisma.automation-event.repository';
import { AutomationController } from './presentation/automation.controller';

@Module({
  imports: [
    DatabaseModule,
    CatalogModule,
    AgendaModule,
    ClientModule,
    AppointmentModule,
  ],
  controllers: [AutomationController],
  providers: [
    {
      provide: 'IAutomationEventRepository',
      useClass: PrismaAutomationEventRepository,
    },
    {
      provide: VerifyAutomationEventUseCase,
      useFactory: (repo: IAutomationEventRepository) =>
        new VerifyAutomationEventUseCase(repo),
      inject: ['IAutomationEventRepository'],
    },
    {
      provide: AutomationEventDispatcher,
      useFactory: (repo: IAutomationEventRepository) =>
        new AutomationEventDispatcher(repo),
      inject: ['IAutomationEventRepository'],
    },
  ],
})
export class AutomationModule {}
