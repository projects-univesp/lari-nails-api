import { Client } from '../domain/client.entity';
import { IClientRepository } from '../domain/client.repository.interface';

export class FindClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(id: string): Promise<Client | null> {
    const client = await this.clientRepository.findById(id);
    return client;
  }
}
