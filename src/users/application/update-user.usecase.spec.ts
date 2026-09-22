/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { UpdateUserUseCase } from './update-user.usecase';
import type { IUserRepository } from '../domain/user.repository.interface';
import type { IPasswordHasher } from '../domain/password-hasher.interface';
import { User } from '../domain/user.entity';

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;

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

    mockPasswordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    useCase = new UpdateUserUseCase(mockUserRepository, mockPasswordHasher);
  });

  it('deve atualizar os dados do usuario com sucesso', async () => {
    const user = new User(
      'Carla Silva',
      'carla@larinails.com',
      'old-hash',
      'colaborador',
    );
    mockUserRepository.findById.mockResolvedValue(user);
    mockPasswordHasher.hash.mockResolvedValue('new-hash');
    mockUserRepository.save.mockResolvedValue();

    const result = await useCase.execute({
      id: user.getId(),
      nome: 'Carla Silva Atualizada',
      senha: 'newpassword123',
    });

    expect(result.getNome()).toBe('Carla Silva Atualizada');
    expect(result.getSenha()).toBe('new-hash');
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('newpassword123');
    expect(mockUserRepository.save).toHaveBeenCalledWith(user);
  });

  it('deve lancar NotFoundException se o usuario nao existir', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: 'id-inexistente',
        nome: 'Novo Nome',
      }),
    ).rejects.toThrow(new NotFoundException('Usuário não encontrado'));

    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });
});
