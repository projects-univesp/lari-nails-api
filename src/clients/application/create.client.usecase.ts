import { Client } from '../domain/client.entity';
import { IClientRepository } from '../domain/client.repository.interface';

export class CreateClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(
    nome: string,
    telefone: string,
    email?: string | null,
    dataNasc?: Date | null,
    status?: string,
    totalFaltas?: number,
  ): Promise<void> {
    const client = new Client(
      nome,
      telefone,
      email ?? null,
      dataNasc ?? null,
      status,
      totalFaltas,
    );

    await this.clientRepository.save(client);
  }
}
