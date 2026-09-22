/* eslint-disable @typescript-eslint/unbound-method */
import { IClientRepository } from '../domain/client.repository.interface';
import { DeleteClientUseCase } from './delete.client.usecase';

describe('Delete Client Use Case', () => {
  it('Deve deletar um cliente por ID', async () => {
    const id = 'dabea031-504f-43b6-86d0-8c1b843ef8e4';

    const mockRepository: IClientRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const deleteClientUseCase = new DeleteClientUseCase(mockRepository);

    const result = await deleteClientUseCase.execute(id);

    expect(mockRepository.delete).toHaveBeenCalledWith(id);
    expect(result).toBeUndefined();
  });
});
