import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../domain/user.repository.interface';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    await this.userRepository.delete(id);
  }
}
