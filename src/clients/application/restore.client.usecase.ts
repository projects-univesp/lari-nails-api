import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IClientRepository } from '../domain/client.repository.interface';
import { Client } from '../domain/client.entity';

@Injectable()
export class RestoreClientUseCase {
  constructor(
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
  ) {}

  async execute(id: string): Promise<Client> {
    const client = await this.clientRepository.findWithDeleted(id);
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    client.restore();
    await this.clientRepository.save(client);
    return client;
  }
}
