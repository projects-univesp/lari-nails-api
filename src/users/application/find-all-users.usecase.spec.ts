/* eslint-disable @typescript-eslint/unbound-method */
import { FindAllUsersUseCase } from './find-all-users.usecase';
import type { IUserRepository } from '../domain/user.repository.interface';
import { User } from '../domain/user.entity';

describe('FindAllUsersUseCase', () => {
  let useCase: FindAllUsersUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findWithDeleted: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    useCase = new FindAllUsersUseCase(mockUserRepository);
  });

  it('deve retornar todos os usuarios ativos', async () => {
    const user1 = new User('Admin', 'admin@mail.com', 'hash1');
    const user2 = new User('Colab', 'colab@mail.com', 'hash2', 'colaborador');
    mockUserRepository.findAll.mockResolvedValue([user1, user2]);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(user1);
    expect(result[1]).toBe(user2);
    expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1);
  });
});
