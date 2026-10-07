import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';

@Injectable()
export class ClientTagRepository {
  constructor(private readonly prisma: PrismaService) {}
  async list(): Promise<string[]> { return (await this.prisma.clientTagModel.findMany({ orderBy: { name: 'asc' } })).map((tag) => tag.name); }
  async create(name: string): Promise<string> {
    try { return (await this.prisma.clientTagModel.create({ data: { name: name.trim() } })).name; }
    catch (error) { if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') throw new ConflictException('Esta etiqueta já existe'); throw error; }
  }
  async delete(name: string): Promise<void> {
    const result = await this.prisma.clientTagModel.deleteMany({ where: { name } });
    if (!result.count) throw new NotFoundException('Etiqueta não encontrada');
  }
}
