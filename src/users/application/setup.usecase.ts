import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { IUserRepository } from '../domain/user.repository.interface';
import type { IPasswordHasher } from '../domain/password-hasher.interface';
import { User } from '../domain/user.entity';

export interface SetupInput {
  nome: string;
  email: string;
  senha: string;
}

export interface SetupOutput {
  token: string;
  user: {
    id: string;
    nome: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class SetupUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPasswordHasher')
    private readonly passwordHasher: IPasswordHasher,
    private readonly jwtService: JwtService,
  ) {}

  async execute(input: SetupInput): Promise<SetupOutput> {
    const totalUsers = await this.userRepository.count();
    if (totalUsers > 0) {
      throw new ForbiddenException('O setup inicial ja foi concluido');
    }

    const hashedPassword = await this.passwordHasher.hash(input.senha);
    const admin = new User(input.nome, input.email, hashedPassword, 'admin');

    await this.userRepository.save(admin);

    const payload = {
      sub: admin.getId(),
      email: admin.getEmail(),
      role: admin.getRole(),
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: admin.getId(),
        nome: admin.getNome(),
        email: admin.getEmail(),
        role: admin.getRole(),
      },
    };
  }
}
