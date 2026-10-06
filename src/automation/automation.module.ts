import { Module } from '@nestjs/common';
import { AgendaModule } from '../agenda/agenda.module';
import { AppointmentModule } from '../appointments/appointment.module';
import { ClientModule } from '../clients/client.module';
import { ServiceModule } from '../services/service.module';
import { AutomationController } from './presentation/automation.controller';
import { AutomationEventDispatcher } from './infra/automation-event.dispatcher';
import { VerifyAutomationEventUseCase } from './application/verify-automation-event.usecase';

@Module({
  imports: [ServiceModule, AgendaModule, ClientModule, AppointmentModule],
  controllers: [AutomationController],
  providers: [AutomationEventDispatcher, VerifyAutomationEventUseCase],
})
export class AutomationModule {}
