import { Inject, Injectable } from '@nestjs/common';
import type { IUserRepository } from '../domain/user.repository.interface';

export interface SetupStatusOutput {
  needsSetup: boolean;
}

@Injectable()
export class SetupStatusUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(): Promise<SetupStatusOutput> {
    const totalUsers = await this.userRepository.count();
    return {
      needsSetup: totalUsers === 0,
    };
  }
}
