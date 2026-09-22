/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { RestoreUserUseCase } from './restore-user.usecase';
import type { IUserRepository } from '../domain/user.repository.interface';
import { User } from '../domain/user.entity';

describe('RestoreUserUseCase', () => {
  let useCase: RestoreUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findWithDeleted: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    useCase = new RestoreUserUseCase(mockUserRepository);
  });

  it('deve restaurar um usuario inativo com sucesso', async () => {
    const user = new User(
      'Carla Silva',
      'carla@larinails.com',
      'hash',
      'colaborador',
    );
    user.markAsDeleted();
    expect(user.isDeleted()).toBe(true);

    mockUserRepository.findWithDeleted.mockResolvedValue(user);
    mockUserRepository.save.mockResolvedValue();

    const result = await useCase.execute(user.getId());

    expect(result.isDeleted()).toBe(false);
    expect(result.getDeletedAt()).toBeNull();
    expect(mockUserRepository.save).toHaveBeenCalledWith(user);
  });

  it('deve lancar NotFoundException se o usuario nao existir', async () => {
    mockUserRepository.findWithDeleted.mockResolvedValue(null);

    await expect(useCase.execute('id-inexistente')).rejects.toThrow(
      new NotFoundException('Usuário não encontrado'),
    );

    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });
});
