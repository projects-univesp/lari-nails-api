import { Inject, Injectable } from '@nestjs/common';
import type { IUserRepository } from '../domain/user.repository.interface';
import { User } from '../domain/user.entity';

@Injectable()
export class FindAllUsersUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
