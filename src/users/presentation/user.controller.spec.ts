import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { CreateUserUseCase } from '../application/create-user.usecase';
import { FindAllUsersUseCase } from '../application/find-all-users.usecase';
import { FindUserUseCase } from '../application/find-user.usecase';
import { DeleteUserUseCase } from '../application/delete-user.usecase';
import { UpdateUserUseCase } from '../application/update-user.usecase';
import { RestoreUserUseCase } from '../application/restore-user.usecase';
import { User } from '../domain/user.entity';

describe('UserController', () => {
  let controller: UserController;

  const mockUser = new User(
    'Carla Silva',
    'carla@larinails.com',
    'hashed-pass',
    'colaborador',
    'dabea031-504f-43b6-86d0-8c1b843ef8e4',
  );

  const mockCreateUserUseCase = {
    execute: jest.fn(),
  };

  const mockFindAllUsersUseCase = {
    execute: jest.fn(),
  };

  const mockFindUserUseCase = {
    execute: jest.fn(),
  };

  const mockDeleteUserUseCase = {
    execute: jest.fn(),
  };

  const mockUpdateUserUseCase = {
    execute: jest.fn(),
  };

  const mockRestoreUserUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: CreateUserUseCase,
          useValue: mockCreateUserUseCase,
        },
        {
          provide: FindAllUsersUseCase,
          useValue: mockFindAllUsersUseCase,
        },
        {
          provide: FindUserUseCase,
          useValue: mockFindUserUseCase,
        },
        {
          provide: DeleteUserUseCase,
          useValue: mockDeleteUserUseCase,
        },
        {
          provide: UpdateUserUseCase,
          useValue: mockUpdateUserUseCase,
        },
        {
          provide: RestoreUserUseCase,
          useValue: mockRestoreUserUseCase,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('deve criar um usuario com sucesso', async () => {
    mockCreateUserUseCase.execute.mockResolvedValue(mockUser);

    const result = await controller.create({
      nome: 'Carla Silva',
      email: 'carla@larinails.com',
      senha: 'password123',
    });

    expect(result.message).toBe('Usuario criado com sucesso');
    expect(result.user.nome).toBe('Carla Silva');
    expect(result.user.email).toBe('carla@larinails.com');
  });

  it('deve listar todos os usuarios ativos', async () => {
    mockFindAllUsersUseCase.execute.mockResolvedValue([mockUser]);

    const result = await controller.findAll();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(mockUser.getId());
    expect(result[0]._links).toBeDefined();
  });

  it('deve buscar um usuario por id', async () => {
    mockFindUserUseCase.execute.mockResolvedValue(mockUser);

    const result = await controller.findById({ id: mockUser.getId() });

    expect(result.id).toBe(mockUser.getId());
    expect(result.nome).toBe('Carla Silva');
  });

  it('deve atualizar dados de um usuario', async () => {
    mockUpdateUserUseCase.execute.mockResolvedValue(mockUser);

    const result = await controller.update(
      { id: mockUser.getId() },
      { nome: 'Carla Atualizada' },
    );

    expect(result.message).toBe('Usuario atualizado com sucesso');
    expect(result.user.nome).toBe('Carla Silva');
  });

  it('deve reativar um usuario inativo com sucesso', async () => {
    mockRestoreUserUseCase.execute.mockResolvedValue(mockUser);

    const result = await controller.restore({ id: mockUser.getId() });

    expect(result.message).toBe('Usuario reativado com sucesso');
    expect(result.user.id).toBe(mockUser.getId());
  });

  it('deve executar soft delete de um usuario por id', async () => {
    mockDeleteUserUseCase.execute.mockResolvedValue(undefined);

    const result = await controller.delete({ id: mockUser.getId() });

    expect(result).toEqual({ message: 'Usuario deletado com sucesso' });
    expect(mockDeleteUserUseCase.execute).toHaveBeenCalledWith(
      mockUser.getId(),
    );
  });
});
