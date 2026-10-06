import { Injectable } from '@nestjs/common';
import { Service } from '../domain/service.entity';
import { IServiceRepository } from '../domain/service.repository.interface';
import { PrismaService } from '../../infra/database/prisma.service';

@Injectable()
export class PrismaServiceRepository implements IServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(service: Service): Promise<void> {
    await this.prisma.serviceModel.upsert({
      where: { id: service.id },
      create: {
        id: service.id,
        name: service.name,
        category: service.category,
        description: service.description,
        priceCents: service.priceCents,
        durationMinutes: service.durationMinutes,
        active: service.active,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      },
      update: {
        name: service.name,
        category: service.category,
        description: service.description,
        priceCents: service.priceCents,
        durationMinutes: service.durationMinutes,
        active: service.active,
        updatedAt: service.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<Service | null> {
    const raw = await this.prisma.serviceModel.findUnique({ where: { id } });
    return raw ? new Service(raw) : null;
  }

  async findAll(active?: boolean): Promise<Service[]> {
    const records = await this.prisma.serviceModel.findMany({
      where: active === undefined ? undefined : { active },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return records.map((record) => new Service(record));
  }
}
