import { Client } from '../domain/client.entity';
import { IClientRepository } from '../domain/client.repository.interface';

export class FindAllClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(): Promise<Client[]> {
    const clients = await this.clientRepository.findAll();
    return clients;
  }
}
