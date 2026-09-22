import { IClientRepository } from '../domain/client.repository.interface';

export class DeleteClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(id: string): Promise<void> {
    await this.clientRepository.delete(id);
  }
}
