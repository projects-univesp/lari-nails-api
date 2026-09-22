import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { IUserRepository } from '../domain/user.repository.interface';
import type { IPasswordHasher } from '../domain/password-hasher.interface';
import { User } from '../domain/user.entity';

export interface CreateUserInput {
  nome: string;
  email: string;
  senha: string;
  role?: string;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPasswordHasher')
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('E-mail ja cadastrado');
    }

    const hashedPassword = await this.passwordHasher.hash(input.senha);
    const role = input.role || 'colaborador';
    const user = new User(input.nome, input.email, hashedPassword, role);

    await this.userRepository.save(user);
    return user;
  }
}
