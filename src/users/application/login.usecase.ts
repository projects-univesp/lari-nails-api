import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { IUserRepository } from '../domain/user.repository.interface';
import type { IPasswordHasher } from '../domain/password-hasher.interface';

export interface LoginOutput {
  token: string;
  user: {
    id: string;
    nome: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPasswordHasher')
    private readonly passwordHasher: IPasswordHasher,
    private readonly jwtService: JwtService,
  ) {}

  async execute(email: string, senha: string): Promise<LoginOutput> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const passwordMatches = await this.passwordHasher.compare(
      senha,
      user.getSenha(),
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const payload = {
      sub: user.getId(),
      email: user.getEmail(),
      role: user.getRole(),
      nome: user.getNome(),
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: {
        id: user.getId(),
        nome: user.getNome(),
        email: user.getEmail(),
        role: user.getRole(),
      },
    };
  }
}
