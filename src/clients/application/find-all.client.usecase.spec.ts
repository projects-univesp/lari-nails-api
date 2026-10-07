/* eslint-disable @typescript-eslint/unbound-method */
import { Client } from '../domain/client.entity';
import { IClientRepository } from '../domain/client.repository.interface';
import { FindAllClientUseCase } from './find-all.client.usecase';

describe('Find All Client Use Case', () => {
  it('Deve retornar todos os clientes', async () => {
    const mockClients = [
      new Client('Cliente 1', '(11) 91111-1111'),
      new Client('Cliente 2', '(11) 92222-2222'),
      new Client('Cliente 3', '(11) 93333-3333'),
    ];

    const mockRepository: IClientRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findWithDeleted: jest.fn(),
      findAll: jest.fn().mockResolvedValue(mockClients),
      delete: jest.fn(),
    };

    const findAllClientUseCase = new FindAllClientUseCase(mockRepository);

    const result = await findAllClientUseCase.execute();

    expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockClients);
  });
});
