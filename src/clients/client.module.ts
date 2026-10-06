import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infra/database/database.module';
import { ClientController } from './presentation/client.controller';
import { CreateClientUseCase } from './application/create.client.usecase';
import { FindAllClientUseCase } from './application/find-all.client.usecase';
import { PrismaClientRepository } from './infra/prisma.client.repository';
import { IClientRepository } from './domain/client.repository.interface';
import { FindClientUseCase } from './application/find.client.usecase';
import { DeleteClientUseCase } from './application/delete.client.usecase';

import { UpdateClientUseCase } from './application/update.client.usecase';
import { RestoreClientUseCase } from './application/restore.client.usecase';
import { ResolveAutomationClientUseCase } from './application/resolve-automation-client.usecase';
import { IClientPhoneRepository } from './domain/client-phone.repository.interface';

@Module({
  imports: [DatabaseModule],
  controllers: [ClientController],
  providers: [
    {
      provide: 'IClientRepository',
      useClass: PrismaClientRepository,
    },
    { provide: 'IClientPhoneRepository', useExisting: 'IClientRepository' },
    {
      provide: ResolveAutomationClientUseCase,
      useFactory: (repo: IClientPhoneRepository) =>
        new ResolveAutomationClientUseCase(repo),
      inject: ['IClientPhoneRepository'],
    },
    {
      provide: CreateClientUseCase,
      useFactory: (repo: IClientRepository) => new CreateClientUseCase(repo),
      inject: ['IClientRepository'],
    },
    {
      provide: FindAllClientUseCase,
      useFactory: (repo: IClientRepository) => new FindAllClientUseCase(repo),
      inject: ['IClientRepository'],
    },
    {
      provide: FindClientUseCase,
      useFactory: (repo: IClientRepository) => new FindClientUseCase(repo),
      inject: ['IClientRepository'],
    },
    {
      provide: UpdateClientUseCase,
      useFactory: (repo: IClientRepository) => new UpdateClientUseCase(repo),
      inject: ['IClientRepository'],
    },
    {
      provide: RestoreClientUseCase,
      useFactory: (repo: IClientRepository) => new RestoreClientUseCase(repo),
      inject: ['IClientRepository'],
    },
    {
      provide: DeleteClientUseCase,
      useFactory: (repo: IClientRepository) => new DeleteClientUseCase(repo),
      inject: ['IClientRepository'],
    },
  ],
  exports: [FindClientUseCase, ResolveAutomationClientUseCase],
})
export class ClientModule {}
