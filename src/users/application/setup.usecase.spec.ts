/* eslint-disable @typescript-eslint/unbound-method */
import { ForbiddenException } from '@nestjs/common';
import { SetupUseCase } from './setup.usecase';
import type { IUserRepository } from '../domain/user.repository.interface';
import type { IPasswordHasher } from '../domain/password-hasher.interface';
import type { JwtService } from '@nestjs/jwt';

describe('SetupUseCase', () => {
  let useCase: SetupUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let mockJwtService: jest.Mocked<JwtService>;

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

    mockJwtService = {
      sign: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    useCase = new SetupUseCase(
      mockUserRepository,
      mockPasswordHasher,
      mockJwtService,
    );
  });

  it('deve criar o primeiro administrador com sucesso e retornar token e usuario', async () => {
    mockUserRepository.count.mockResolvedValue(0);
    mockPasswordHasher.hash.mockResolvedValue('hashed-pass');
    mockJwtService.sign.mockReturnValue('jwt-token-123');

    const result = await useCase.execute({
      nome: 'Administradora',
      email: 'admin@larinails.com',
      senha: 'adminpassword',
    });

    expect(result.token).toBe('jwt-token-123');
    expect(result.user.nome).toBe('Administradora');
    expect(result.user.email).toBe('admin@larinails.com');
    expect(result.user.role).toBe('admin');
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
  });

  it('deve lancar ForbiddenException se ja existirem usuarios cadastrados', async () => {
    mockUserRepository.count.mockResolvedValue(1);

    await expect(
      useCase.execute({
        nome: 'Administradora',
        email: 'admin@larinails.com',
        senha: 'adminpassword',
      }),
    ).rejects.toThrow(
      new ForbiddenException('O setup inicial ja foi concluido'),
    );

    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });
});
