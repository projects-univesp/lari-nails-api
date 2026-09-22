/* eslint-disable @typescript-eslint/unbound-method */
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginUseCase } from './login.usecase';
import type { IUserRepository } from '../domain/user.repository.interface';
import type { IPasswordHasher } from '../domain/password-hasher.interface';
import { User } from '../domain/user.entity';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findWithDeleted: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    useCase = new LoginUseCase(userRepository, passwordHasher, jwtService);
  });

  it('deve autenticar o usuario e retornar o token com dados do usuario', async () => {
    const user = new User('Admin', 'admin@mail.com', 'hashed-pw', 'admin');
    userRepository.findByEmail.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('jwt-mock-token');

    const result = await useCase.execute('admin@mail.com', 'plain-pw');

    expect(result.token).toBe('jwt-mock-token');
    expect(result.user.email).toBe('admin@mail.com');
    expect(result.user.nome).toBe('Admin');
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.getId(),
      email: 'admin@mail.com',
      role: 'admin',
      nome: 'Admin',
    });
  });

  it('deve lancar UnauthorizedException se o usuario nao for encontrado', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute('notfound@mail.com', 'any-pw'),
    ).rejects.toThrow(new UnauthorizedException('Credenciais invalidas'));
  });

  it('deve lancar UnauthorizedException se a senha nao conferir', async () => {
    const user = new User('Admin', 'admin@mail.com', 'hashed-pw');
    userRepository.findByEmail.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(useCase.execute('admin@mail.com', 'wrong-pw')).rejects.toThrow(
      new UnauthorizedException('Credenciais invalidas'),
    );
  });
});
