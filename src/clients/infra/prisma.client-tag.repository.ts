import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/database/prisma.service';
import { IClientTagRepository } from '../domain/client-tag.repository.interface';

@Injectable()
export class PrismaClientTagRepository implements IClientTagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<string[]> {
    const tags = await this.prisma.clientTagModel.findMany({
      orderBy: { name: 'asc' },
    });
    return tags.map((tag) => tag.name);
  }

  async create(name: string): Promise<string> {
    try {
      const tag = await this.prisma.clientTagModel.create({
        data: { name: name.trim() },
      });
      return tag.name;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Esta etiqueta já existe');
      }
      throw error;
    }
  }

  async delete(name: string): Promise<void> {
    const result = await this.prisma.clientTagModel.deleteMany({
      where: { name },
    });
    if (!result.count) {
      throw new NotFoundException('Etiqueta não encontrada');
    }
  }
}
