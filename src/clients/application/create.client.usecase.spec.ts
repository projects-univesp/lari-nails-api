/* eslint-disable @typescript-eslint/unbound-method */
import { CreateClientUseCase } from './create.client.usecase';
import { IClientRepository } from '../domain/client.repository.interface';

describe('Create Client Use Case', () => {
  it('Deve criar um cliente e salvar no repositorio', async () => {
    const nome = 'Maria da Silva';
    const telefone = '(11) 98765-4321';

    const mockRepository: IClientRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const createClientUseCase = new CreateClientUseCase(mockRepository);

    await createClientUseCase.execute(nome, telefone);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: nome,
        telefone: telefone,
        status: 'ativo',
        totalFaltas: 0,
      }),
    );
  });
});
