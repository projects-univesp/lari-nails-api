import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../domain/user.repository.interface';
import { User } from '../domain/user.entity';

@Injectable()
export class RestoreUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepository.findWithDeleted(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    user.restore();
    await this.userRepository.save(user);
    return user;
  }
}
