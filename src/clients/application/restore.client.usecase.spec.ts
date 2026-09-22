/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { RestoreClientUseCase } from './restore.client.usecase';
import type { IClientRepository } from '../domain/client.repository.interface';
import { Client } from '../domain/client.entity';

describe('RestoreClientUseCase', () => {
  let useCase: RestoreClientUseCase;
  let mockClientRepository: jest.Mocked<IClientRepository>;

  beforeEach(() => {
    mockClientRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findWithDeleted: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new RestoreClientUseCase(mockClientRepository);
  });

  it('deve restaurar um cliente inativo com sucesso', async () => {
    const client = new Client('Maria da Silva', '(11) 98765-4321');
    client.markAsDeleted();
    expect(client.isDeleted()).toBe(true);

    mockClientRepository.findWithDeleted.mockResolvedValue(client);
    mockClientRepository.save.mockResolvedValue();

    const result = await useCase.execute(client.getId());

    expect(result.isDeleted()).toBe(false);
    expect(result.getDeletedAt()).toBeNull();
    expect(mockClientRepository.save).toHaveBeenCalledWith(client);
  });

  it('deve lancar NotFoundException se o cliente nao existir', async () => {
    mockClientRepository.findWithDeleted.mockResolvedValue(null);

    await expect(useCase.execute('id-inexistente')).rejects.toThrow(
      new NotFoundException('Cliente não encontrado'),
    );

    expect(mockClientRepository.save).not.toHaveBeenCalled();
  });
});
