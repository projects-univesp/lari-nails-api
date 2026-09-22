/* eslint-disable @typescript-eslint/unbound-method */
import { ConflictException } from '@nestjs/common';
import { CreateUserUseCase } from './create-user.usecase';
import type { IUserRepository } from '../domain/user.repository.interface';
import type { IPasswordHasher } from '../domain/password-hasher.interface';
import { User } from '../domain/user.entity';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;

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

    mockPasswordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    useCase = new CreateUserUseCase(mockUserRepository, mockPasswordHasher);
  });

  it('deve criar uma colaboradora com sucesso', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockPasswordHasher.hash.mockResolvedValue('hashed-pass-123');

    const result = await useCase.execute({
      nome: 'Carla Silva',
      email: 'carla@larinails.com',
      senha: 'securepassword',
    });

    expect(result.getNome()).toBe('Carla Silva');
    expect(result.getEmail()).toBe('carla@larinails.com');
    expect(result.getRole()).toBe('colaborador');
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
  });

  it('deve lancar ConflictException se o email ja estiver cadastrado', async () => {
    const existingUser = new User('Existing', 'carla@larinails.com', 'hash');
    mockUserRepository.findByEmail.mockResolvedValue(existingUser);

    await expect(
      useCase.execute({
        nome: 'Carla Silva',
        email: 'carla@larinails.com',
        senha: 'securepassword',
      }),
    ).rejects.toThrow(new ConflictException('E-mail ja cadastrado'));

    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });
});
