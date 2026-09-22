import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../domain/user.repository.interface';
import { User } from '../domain/user.entity';
import { PrismaService } from '../../infra/database/prisma.service';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.userModel.findFirst({
      where: { email, deletedAt: null },
    });

    if (!raw) {
      return null;
    }

    return new User(
      raw.nome,
      raw.email,
      raw.senha,
      raw.role,
      raw.id,
      raw.createdAt,
      raw.updatedAt,
      raw.deletedAt,
    );
  }

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.userModel.findFirst({
      where: { id, deletedAt: null },
    });

    if (!raw) {
      return null;
    }

    return new User(
      raw.nome,
      raw.email,
      raw.senha,
      raw.role,
      raw.id,
      raw.createdAt,
      raw.updatedAt,
      raw.deletedAt,
    );
  }

  async findWithDeleted(id: string): Promise<User | null> {
    const raw = await this.prisma.userModel.findUnique({
      where: { id },
    });

    if (!raw) {
      return null;
    }

    return new User(
      raw.nome,
      raw.email,
      raw.senha,
      raw.role,
      raw.id,
      raw.createdAt,
      raw.updatedAt,
      raw.deletedAt,
    );
  }

  async findAll(): Promise<User[]> {
    const records = await this.prisma.userModel.findMany({
      where: { deletedAt: null },
    });

    return records.map(
      (raw) =>
        new User(
          raw.nome,
          raw.email,
          raw.senha,
          raw.role,
          raw.id,
          raw.createdAt,
          raw.updatedAt,
          raw.deletedAt,
        ),
    );
  }

  async save(user: User): Promise<void> {
    await this.prisma.userModel.upsert({
      where: { id: user.getId() },
      create: {
        id: user.getId(),
        nome: user.getNome(),
        email: user.getEmail(),
        senha: user.getSenha(),
        role: user.getRole(),
        createdAt: user.getCreatedAt(),
        updatedAt: user.getUpdatedAt(),
        deletedAt: user.getDeletedAt(),
      },
      update: {
        nome: user.getNome(),
        email: user.getEmail(),
        senha: user.getSenha(),
        role: user.getRole(),
        updatedAt: user.getUpdatedAt(),
        deletedAt: user.getDeletedAt(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.userModel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async count(): Promise<number> {
    return this.prisma.userModel.count({
      where: { deletedAt: null },
    });
  }
}
