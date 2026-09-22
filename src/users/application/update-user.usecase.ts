import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../domain/user.repository.interface';
import type { IPasswordHasher } from '../domain/password-hasher.interface';
import { User } from '../domain/user.entity';

export interface UpdateUserInput {
  id: string;
  nome?: string;
  senha?: string;
  role?: string;
}

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPasswordHasher')
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: UpdateUserInput): Promise<User> {
    const user = await this.userRepository.findById(input.id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    let senhaHash: string | undefined;
    if (input.senha) {
      senhaHash = await this.passwordHasher.hash(input.senha);
    }

    user.update({
      nome: input.nome,
      senha: senhaHash,
      role: input.role,
    });

    await this.userRepository.save(user);
    return user;
  }
}
