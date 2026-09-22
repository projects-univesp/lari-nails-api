import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IClientRepository } from '../domain/client.repository.interface';
import { Client } from '../domain/client.entity';

export interface UpdateClientInput {
  id: string;
  nome?: string;
  telefone?: string;
  status?: string;
  totalFaltas?: number;
}

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
  ) {}

  async execute(input: UpdateClientInput): Promise<Client> {
    const client = await this.clientRepository.findById(input.id);
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    client.update({
      nome: input.nome,
      telefone: input.telefone,
      status: input.status,
      totalFaltas: input.totalFaltas,
    });

    await this.clientRepository.save(client);
    return client;
  }
}
