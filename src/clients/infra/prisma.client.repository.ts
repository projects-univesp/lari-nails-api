import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Client } from '../domain/client.entity';
import { IClientRepository } from '../domain/client.repository.interface';
import { PrismaService } from '../../infra/database/prisma.service';
import { normalizeBrazilianPhone } from '../domain/normalize-phone';

@Injectable()
export class PrismaClientRepository implements IClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(client: Client): Promise<void> {
    const phone = normalizeBrazilianPhone(client.getTelefone());
    if (phone) {
      const matches = await this.findPhoneMatches(phone);
      if (matches.some((item) => item.id !== client.getId())) {
        throw new ConflictException(
          'Telefone já cadastrado para outro cliente',
        );
      }
    }
    try {
      await this.prisma.clientModel.upsert({
        where: { id: client.getId() },
        create: {
          id: client.getId(),
          nome: client.getNome(),
          telefone: client.getTelefone(),
          normalizedPhone: client.isDeleted() ? null : phone,
          status: client.getStatus(),
          totalFaltas: client.getTotalFaltas(),
          tags: client.getTags(),
          birthday: client.getBirthday(),
          createdAt: client.getCreatedAt(),
          updatedAt: client.getUpdatedAt(),
          deletedAt: client.getDeletedAt(),
        },
        update: {
          nome: client.getNome(),
          telefone: client.getTelefone(),
          normalizedPhone: client.isDeleted() ? null : phone,
          status: client.getStatus(),
          totalFaltas: client.getTotalFaltas(),
          tags: client.getTags(),
          birthday: client.getBirthday(),
          updatedAt: client.getUpdatedAt(),
          deletedAt: client.getDeletedAt(),
        },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Telefone já cadastrado para outro cliente',
        );
      }
      throw error;
    }
  }

  async resolvePhone(
    nome: string,
    telefone: string,
  ): Promise<{ client: Client; created: boolean }> {
    const phone = normalizeBrazilianPhone(telefone);
    if (!phone) throw new BadRequestException('Telefone brasileiro inválido');
    const matches = await this.findPhoneMatches(phone);
    if (matches.length > 1) {
      throw new ConflictException(
        'Há clientes duplicados com este telefone; revise o cadastro',
      );
    }
    if (matches.length === 1) {
      const existing = matches[0];
      if (!existing.normalizedPhone) {
        try {
          const claimed = await this.prisma.clientModel.updateMany({
            where: {
              id: existing.id,
              telefone: existing.telefone,
              normalizedPhone: null,
              deletedAt: null,
            },
            data: { normalizedPhone: phone },
          });
          if (claimed.count === 1) {
            return { client: this.toClient(existing), created: false };
          }
        } catch (error) {
          if (!this.isUniqueViolation(error)) throw error;
        }
        const concurrent = await this.findPhoneMatches(phone);
        if (concurrent.length !== 1) {
          throw new ConflictException(
            'Telefone alterado durante a consulta; tente novamente',
          );
        }
        return { client: this.toClient(concurrent[0]), created: false };
      }
      return { client: this.toClient(existing), created: false };
    }
    const client = new Client(nome, `+${phone}`);
    try {
      await this.prisma.clientModel.create({
        data: {
          id: client.getId(),
          nome: client.getNome(),
          telefone: client.getTelefone(),
          normalizedPhone: phone,
          status: client.getStatus(),
          totalFaltas: client.getTotalFaltas(),
        },
      });
      return { client, created: true };
    } catch (error) {
      if (!this.isUniqueViolation(error)) throw error;
      const concurrent = await this.findPhoneMatches(phone);
      if (concurrent.length === 1)
        return { client: this.toClient(concurrent[0]), created: false };
      throw new ConflictException('Telefone já cadastrado para outro cliente');
    }
  }

  private async findPhoneMatches(phone: string) {
    const candidates = await this.prisma.clientModel.findMany({
      where: {
        deletedAt: null,
        OR: [{ normalizedPhone: phone }, { normalizedPhone: null }],
      },
    });
    return candidates.filter(
      (item) => normalizeBrazilianPhone(item.telefone) === phone,
    );
  }

  private toClient(
    raw: Awaited<ReturnType<typeof this.findPhoneMatches>>[number],
  ): Client {
    return new Client(
      raw.nome,
      raw.telefone,
      raw.status,
      raw.totalFaltas,
      raw.id,
      raw.createdAt,
      raw.updatedAt,
      raw.deletedAt,
      raw.tags,
      raw.birthday,
    );
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
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
      raw.status,
      raw.totalFaltas,
      raw.id,
      raw.createdAt,
      raw.updatedAt,
      raw.deletedAt,
      raw.tags,
      raw.birthday,
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
      raw.status,
      raw.totalFaltas,
      raw.id,
      raw.createdAt,
      raw.updatedAt,
      raw.deletedAt,
      raw.tags,
      raw.birthday,
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
          raw.status,
          raw.totalFaltas,
          raw.id,
          raw.createdAt,
          raw.updatedAt,
          raw.deletedAt,
          raw.tags,
          raw.birthday,
        ),
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.clientModel.update({
      where: { id },
      data: { deletedAt: new Date(), normalizedPhone: null },
    });
  }
}
