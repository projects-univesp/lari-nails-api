/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { FindUserUseCase } from './find-user.usecase';
import type { IUserRepository } from '../domain/user.repository.interface';
import { User } from '../domain/user.entity';

describe('FindUserUseCase', () => {
  let useCase: FindUserUseCase;
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

    useCase = new FindUserUseCase(mockUserRepository);
  });

  it('deve retornar o usuario se for encontrado', async () => {
    const user = new User('Admin', 'admin@mail.com', 'hash');
    mockUserRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute(user.getId());

    expect(result).toBe(user);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(user.getId());
  });

  it('deve lancar NotFoundException se o usuario nao for encontrado', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('invalid-id')).rejects.toThrow(
      new NotFoundException('Usuario nao encontrado'),
    );
  });
});
