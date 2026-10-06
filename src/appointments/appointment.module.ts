import { Module } from '@nestjs/common';
import { AgendaModule } from '../agenda/agenda.module';
import { FindAvailabilityUseCase } from '../agenda/application/find-availability.usecase';
import { ClientModule } from '../clients/client.module';
import { FindClientUseCase } from '../clients/application/find.client.usecase';
import { DatabaseModule } from '../infra/database/database.module';
import { FindServiceUseCase } from '../services/application/find.service.usecase';
import { ServiceModule } from '../services/service.module';
import { AppointmentUseCase } from './application/appointment.usecase';
import { IAppointmentRepository } from './domain/appointment.repository.interface';
import { PrismaAppointmentRepository } from './infra/prisma.appointment.repository';
import { AppointmentController } from './presentation/appointment.controller';

@Module({
  imports: [DatabaseModule, ClientModule, ServiceModule, AgendaModule],
  controllers: [AppointmentController],
  providers: [
    {
      provide: 'IAppointmentRepository',
      useClass: PrismaAppointmentRepository,
    },
    {
      provide: AppointmentUseCase,
      useFactory: (
        repo: IAppointmentRepository,
        client: FindClientUseCase,
        service: FindServiceUseCase,
        availability: FindAvailabilityUseCase,
      ) => new AppointmentUseCase(repo, client, service, availability),
      inject: [
        'IAppointmentRepository',
        FindClientUseCase,
        FindServiceUseCase,
        FindAvailabilityUseCase,
      ],
    },
  ],
  exports: [AppointmentUseCase],
})
export class AppointmentModule {}
