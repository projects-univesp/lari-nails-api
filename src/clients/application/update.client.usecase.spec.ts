/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { UpdateClientUseCase } from './update.client.usecase';
import type { IClientRepository } from '../domain/client.repository.interface';
import { Client } from '../domain/client.entity';

describe('UpdateClientUseCase', () => {
  let useCase: UpdateClientUseCase;
  let mockClientRepository: jest.Mocked<IClientRepository>;

  beforeEach(() => {
    mockClientRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findWithDeleted: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new UpdateClientUseCase(mockClientRepository);
  });

  it('deve atualizar os dados do cliente com sucesso', async () => {
    const client = new Client('Maria da Silva', '(11) 98765-4321');
    mockClientRepository.findById.mockResolvedValue(client);
    mockClientRepository.save.mockResolvedValue();

    const result = await useCase.execute({
      id: client.getId(),
      nome: 'Maria Silva Atualizada',
      telefone: '(11) 99999-8888',
      totalFaltas: 2,
    });

    expect(result.getNome()).toBe('Maria Silva Atualizada');
    expect(result.getTelefone()).toBe('(11) 99999-8888');
    expect(result.getTotalFaltas()).toBe(2);
    expect(mockClientRepository.save).toHaveBeenCalledWith(client);
  });

  it('deve lancar NotFoundException se o cliente nao existir', async () => {
    mockClientRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: 'id-inexistente',
        nome: 'Novo Nome',
      }),
    ).rejects.toThrow(new NotFoundException('Cliente não encontrado'));

    expect(mockClientRepository.save).not.toHaveBeenCalled();
  });
});
