/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { DeleteUserUseCase } from './delete-user.usecase';
import type { IUserRepository } from '../domain/user.repository.interface';
import { User } from '../domain/user.entity';

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase;
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

    useCase = new DeleteUserUseCase(mockUserRepository);
  });

  it('deve realizar soft delete do usuario quando ele existir', async () => {
    const user = new User('Colab', 'colab@mail.com', 'hash', 'colaborador');
    mockUserRepository.findById.mockResolvedValue(user);
    mockUserRepository.delete.mockResolvedValue();

    await useCase.execute(user.getId());

    expect(mockUserRepository.findById).toHaveBeenCalledWith(user.getId());
    expect(mockUserRepository.delete).toHaveBeenCalledWith(user.getId());
  });

  it('deve lancar NotFoundException se o usuario nao existir', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('invalid-id')).rejects.toThrow(
      new NotFoundException('Usuario nao encontrado'),
    );
    expect(mockUserRepository.delete).not.toHaveBeenCalled();
  });
});
