import { Module } from '@nestjs/common';
import { AgendaModule } from '../agenda/agenda.module';
import { FindAvailabilityUseCase } from '../agenda/application/find-availability.usecase';
import { ClientModule } from '../clients/client.module';
import { FindClientUseCase } from '../clients/application/find.client.usecase';
import { DatabaseModule } from '../infra/database/database.module';
import { FindCatalogItemUseCase } from '../catalog/application/find.catalog-item.usecase';
import { CatalogModule } from '../catalog/catalog.module';
import { AppointmentUseCase } from './application/appointment.usecase';
import { IAppointmentRepository } from './domain/appointment.repository.interface';
import { PrismaAppointmentRepository } from './infra/prisma.appointment.repository';
import { AppointmentController } from './presentation/appointment.controller';

@Module({
  imports: [DatabaseModule, ClientModule, CatalogModule, AgendaModule],
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
        service: FindCatalogItemUseCase,
        availability: FindAvailabilityUseCase,
      ) => new AppointmentUseCase(repo, client, service, availability),
      inject: [
        'IAppointmentRepository',
        FindClientUseCase,
        FindCatalogItemUseCase,
        FindAvailabilityUseCase,
      ],
    },
  ],
  exports: [AppointmentUseCase],
})
export class AppointmentModule {}
