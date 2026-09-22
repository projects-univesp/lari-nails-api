/* eslint-disable @typescript-eslint/unbound-method */
import { SetupStatusUseCase } from './setup-status.usecase';
import type { IUserRepository } from '../domain/user.repository.interface';

describe('SetupStatusUseCase', () => {
  let useCase: SetupStatusUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findWithDeleted: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    useCase = new SetupStatusUseCase(mockUserRepository);
  });

  it('deve retornar needsSetup: true quando a contagem de usuarios for 0', async () => {
    mockUserRepository.count.mockResolvedValue(0);

    const result = await useCase.execute();

    expect(result).toEqual({ needsSetup: true });
    expect(mockUserRepository.count).toHaveBeenCalledTimes(1);
  });

  it('deve retornar needsSetup: false quando existirem usuarios cadastrados', async () => {
    mockUserRepository.count.mockResolvedValue(1);

    const result = await useCase.execute();

    expect(result).toEqual({ needsSetup: false });
    expect(mockUserRepository.count).toHaveBeenCalledTimes(1);
  });
});
