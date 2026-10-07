import { Injectable } from '@nestjs/common';
import { Client } from '../domain/client.entity';
import { IClientRepository } from '../domain/client.repository.interface';
import { PrismaService } from '../../infra/database/prisma.service';

@Injectable()
export class PrismaClientRepository implements IClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(client: Client): Promise<void> {
    await this.prisma.clientModel.upsert({
      where: { id: client.getId() },
      create: {
        id: client.getId(),
        nome: client.getNome(),
        telefone: client.getTelefone(),
        email: client.getEmail(),
        dataNasc: client.getDataNasc(),
        status: client.getStatus(),
        totalFaltas: client.getTotalFaltas(),
        createdAt: client.getCreatedAt(),
        updatedAt: client.getUpdatedAt(),
        deletedAt: client.getDeletedAt(),
      },
      update: {
        nome: client.getNome(),
        telefone: client.getTelefone(),
        email: client.getEmail(),
        dataNasc: client.getDataNasc(),
        status: client.getStatus(),
        totalFaltas: client.getTotalFaltas(),
        updatedAt: client.getUpdatedAt(),
        deletedAt: client.getDeletedAt(),
      },
    });
  }

  async findById(id: string): Promise<Client | null> {
    const raw = await this.prisma.clientModel.findFirst({
      where: { id, deletedAt: null },
    });

    if (!raw) {
      return null;
    }

    return new Client(
      raw.nome,
      raw.telefone,
      raw.email,
      raw.dataNasc,
      raw.status,
      raw.totalFaltas,
      raw.id,
      raw.createdAt,
      raw.updatedAt,
      raw.deletedAt,
    );
  }

  async findWithDeleted(id: string): Promise<Client | null> {
    const raw = await this.prisma.clientModel.findUnique({
      where: { id },
    });

    if (!raw) {
      return null;
    }

    return new Client(
      raw.nome,
      raw.telefone,
      raw.email,
      raw.dataNasc,
      raw.status,
      raw.totalFaltas,
      raw.id,
      raw.createdAt,
      raw.updatedAt,
      raw.deletedAt,
    );
  }

  async findAll(): Promise<Client[]> {
    const records = await this.prisma.clientModel.findMany({
      where: { deletedAt: null },
    });
    return records.map(
      (raw) =>
        new Client(
          raw.nome,
          raw.telefone,
          raw.email,
          raw.dataNasc,
          raw.status,
          raw.totalFaltas,
          raw.id,
          raw.createdAt,
          raw.updatedAt,
          raw.deletedAt,
        ),
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.clientModel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
