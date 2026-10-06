/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientRepository } from './prisma.client.repository';
import { PrismaService } from '../../infra/database/prisma.service';
import { Client } from '../domain/client.entity';

describe('PrismaClientRepository', () => {
  let repository: PrismaClientRepository;

  const mockPrismaService = {
    clientModel: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaClientRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PrismaClientRepository>(PrismaClientRepository);
  });

  it('deve salvar um cliente usando upsert', async () => {
    const client = new Client('Maria da Silva', '(11) 98765-4321');
    mockPrismaService.clientModel.upsert.mockResolvedValue({});
    mockPrismaService.clientModel.findMany.mockResolvedValue([]);

    await repository.save(client);

    expect(mockPrismaService.clientModel.upsert).toHaveBeenCalledWith({
      where: { id: client.getId() },
      create: {
        id: client.getId(),
        nome: client.getNome(),
        telefone: client.getTelefone(),
        normalizedPhone: '5511987654321',
        status: client.getStatus(),
        totalFaltas: client.getTotalFaltas(),
        createdAt: client.getCreatedAt(),
        updatedAt: client.getUpdatedAt(),
        deletedAt: null,
      },
      update: {
        nome: client.getNome(),
        telefone: client.getTelefone(),
        normalizedPhone: '5511987654321',
        status: client.getStatus(),
        totalFaltas: client.getTotalFaltas(),
        updatedAt: client.getUpdatedAt(),
        deletedAt: null,
      },
    });
  });

  it('deve encontrar um cliente por id', async () => {
    const customId = 'dabea031-504f-43b6-86d0-8c1b843ef8e4';
    const rawData = {
      id: customId,
      nome: 'Maria da Silva',
      telefone: '(11) 98765-4321',
      status: 'ativo',
      totalFaltas: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockPrismaService.clientModel.findFirst.mockResolvedValue(rawData);

    const client = await repository.findById(customId);

    expect(client).not.toBeNull();
    expect(client?.getId()).toBe(customId);
    expect(client?.getNome()).toBe('Maria da Silva');
  });

  it('reusa cadastro legado pelo JID e ocupa a chave normalizada', async () => {
    const raw = {
      id: 'dabea031-504f-43b6-86d0-8c1b843ef8e4',
      nome: 'Maria',
      telefone: '(11) 98765-4321',
      normalizedPhone: null,
      status: 'ativo',
      totalFaltas: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    mockPrismaService.clientModel.findMany.mockResolvedValue([raw]);
    mockPrismaService.clientModel.updateMany.mockResolvedValue({ count: 1 });

    const result = await repository.resolvePhone(
      'Outro nome',
      '5511987654321@s.whatsapp.net',
    );

    expect(result.created).toBe(false);
    expect(result.client.getId()).toBe(raw.id);
    expect(mockPrismaService.clientModel.updateMany).toHaveBeenCalledWith({
      where: {
        id: raw.id,
        telefone: raw.telefone,
        normalizedPhone: null,
        deletedAt: null,
      },
      data: { normalizedPhone: '5511987654321' },
    });
  });

  it('não escolhe arbitrariamente entre cadastros legados duplicados', async () => {
    mockPrismaService.clientModel.findMany.mockResolvedValue([
      { id: 'one', telefone: '(11) 98765-4321' },
      { id: 'two', telefone: '+55 11 98765-4321' },
    ]);
    await expect(
      repository.resolvePhone('Maria', '5511987654321'),
    ).rejects.toThrow('Há clientes duplicados');
  });

  it('deve retornar null se cliente nao for encontrado', async () => {
    mockPrismaService.clientModel.findFirst.mockResolvedValue(null);

    const client = await repository.findById('nao-existe');

    expect(client).toBeNull();
  });

  it('deve retornar lista de clientes mapeados ignorando deletados', async () => {
    const customId = 'dabea031-504f-43b6-86d0-8c1b843ef8e4';
    const rawList = [
      {
        id: customId,
        nome: 'Maria da Silva',
        telefone: '(11) 98765-4321',
        status: 'ativo',
        totalFaltas: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ];

    mockPrismaService.clientModel.findMany.mockResolvedValue(rawList);

    const clients = await repository.findAll();

    expect(clients).toHaveLength(1);
    expect(clients[0].getId()).toBe(customId);
    expect(mockPrismaService.clientModel.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
    });
  });

  it('deve executar soft delete de um cliente por id', async () => {
    const customId = 'dabea031-504f-43b6-86d0-8c1b843ef8e4';
    mockPrismaService.clientModel.update.mockResolvedValue({});

    await repository.delete(customId);

    expect(mockPrismaService.clientModel.update).toHaveBeenCalledWith({
      where: { id: customId },
      data: { deletedAt: expect.any(Date), normalizedPhone: null },
    });
  });
});
