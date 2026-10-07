import { Module } from '@nestjs/common';
import { DatabaseModule } from './infra/database/database.module';
import { SecurityModule } from './infra/security/security.module';
import { HttpModule } from './infra/http/http.module';
import { ClientModule } from './clients/client.module';
import { UsersModule } from './users/users.module';
import { ServiceModule } from './services/service.module';
import { AgendaModule } from './agenda/agenda.module';
import { AppointmentModule } from './appointments/appointment.module';
import { AutomationModule } from './automation/automation.module';
import { AppController } from './app.controller';
import { FinanceModule } from './finance/finance.module';

@Module({
  imports: [
    DatabaseModule,
    SecurityModule,
    HttpModule,
    ClientModule,
    UsersModule,
    ServiceModule,
    AgendaModule,
    AppointmentModule,
    AutomationModule,
    FinanceModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
