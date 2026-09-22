import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../domain/user.repository.interface';
import { User } from '../domain/user.entity';

@Injectable()
export class FindUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    return user;
  }
}
