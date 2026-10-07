/* eslint-disable @typescript-eslint/unbound-method */
import { Client } from '../domain/client.entity';
import { IClientRepository } from '../domain/client.repository.interface';
import { FindClientUseCase } from './find.client.usecase';

describe('Find Client Use Case', () => {
  it('Deve encontrar um cliente por ID', async () => {
    const id = 'dabea031-504f-43b6-86d0-8c1b843ef8e4';
    const expectedClient = new Client(
      'Maria da Silva',
      '(11) 98765-4321',
      null,
      null,
      'ativo',
      0,
      id,
    );

    const mockRepository: IClientRepository = {
      save: jest.fn(),
      findById: jest.fn().mockResolvedValue(expectedClient),
      findWithDeleted: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const findClientUseCase = new FindClientUseCase(mockRepository);

    const result = await findClientUseCase.execute(id);

    expect(mockRepository.findById).toHaveBeenCalledWith(id);
    expect(result).toEqual(expectedClient);
  });
});
