/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ClientController } from './client.controller';
import { CreateClientUseCase } from '../application/create.client.usecase';
import { FindAllClientUseCase } from '../application/find-all.client.usecase';
import { Client } from '../domain/client.entity';
import { FindClientUseCase } from '../application/find.client.usecase';
import { DeleteClientUseCase } from '../application/delete.client.usecase';
import { UpdateClientUseCase } from '../application/update.client.usecase';
import { RestoreClientUseCase } from '../application/restore.client.usecase';

describe('ClientController', () => {
  let controller: ClientController;
  let createUseCase: CreateClientUseCase;
  let findAllUseCase: FindAllClientUseCase;
  let updateUseCase: UpdateClientUseCase;
  let restoreUseCase: RestoreClientUseCase;

  const mockClient = new Client(
    'Maria da Silva',
    '(11) 98765-4321',
    'ativo',
    0,
    '123e4567-e89b-12d3-a456-426614174000',
  );

  beforeEach(async () => {
    const mockCreateUseCase = { execute: jest.fn() };
    const mockFindAllUseCase = { execute: jest.fn() };
    const mockFindUseCase = { execute: jest.fn() };
    const mockDeleteUseCase = { execute: jest.fn() };
    const mockUpdateUseCase = { execute: jest.fn() };
    const mockRestoreUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
        { provide: CreateClientUseCase, useValue: mockCreateUseCase },
        { provide: FindAllClientUseCase, useValue: mockFindAllUseCase },
        { provide: FindClientUseCase, useValue: mockFindUseCase },
        { provide: DeleteClientUseCase, useValue: mockDeleteUseCase },
        { provide: UpdateClientUseCase, useValue: mockUpdateUseCase },
        { provide: RestoreClientUseCase, useValue: mockRestoreUseCase },
      ],
    }).compile();

    controller = module.get<ClientController>(ClientController);
    createUseCase = module.get<CreateClientUseCase>(CreateClientUseCase);
    findAllUseCase = module.get<FindAllClientUseCase>(FindAllClientUseCase);
    updateUseCase = module.get<UpdateClientUseCase>(UpdateClientUseCase);
    restoreUseCase = module.get<RestoreClientUseCase>(RestoreClientUseCase);
  });

  it('deve chamar o caso de uso de criacao com os dados corretos', async () => {
    const body = {
      nome: 'Maria da Silva',
      telefone: '(11) 98765-4321',
      status: 'ativo',
      totalFaltas: 0,
    };
    const result = await controller.create(body);

    expect(createUseCase.execute).toHaveBeenCalledTimes(1);
    expect(createUseCase.execute).toHaveBeenCalledWith(
      body.nome,
      body.telefone,
      body.status,
      body.totalFaltas,
    );
    expect(result).toEqual({ message: 'Cliente criado com sucesso' });
  });

  it('deve retornar uma lista de clientes mapeados corretamente', async () => {
    jest.spyOn(findAllUseCase, 'execute').mockResolvedValue([mockClient]);

    const result = await controller.findAll();

    expect(findAllUseCase.execute).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: mockClient.getId(),
      nome: mockClient.getNome(),
      telefone: mockClient.getTelefone(),
      status: mockClient.getStatus(),
      totalFaltas: mockClient.getTotalFaltas(),
      createdAt: mockClient.getCreatedAt(),
      updatedAt: mockClient.getUpdatedAt(),
      _links: {
        self: { href: `/clients/${mockClient.getId()}` },
        collection: { href: '/clients' },
      },
    });
  });

  it('deve atualizar um cliente com sucesso', async () => {
    jest.spyOn(updateUseCase, 'execute').mockResolvedValue(mockClient);

    const result = await controller.update(
      { id: mockClient.getId() },
      { nome: 'Maria Atualizada' },
    );

    expect(result.message).toBe('Cliente atualizado com sucesso');
    expect(result.client.nome).toBe('Maria da Silva');
  });

  it('deve reativar um cliente inativo com sucesso', async () => {
    jest.spyOn(restoreUseCase, 'execute').mockResolvedValue(mockClient);

    const result = await controller.restore({ id: mockClient.getId() });

    expect(result.message).toBe('Cliente reativado com sucesso');
    expect(result.client.id).toBe(mockClient.getId());
  });
});
