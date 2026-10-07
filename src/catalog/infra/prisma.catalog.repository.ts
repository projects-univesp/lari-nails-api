import { Injectable } from '@nestjs/common';
import { CatalogItem } from '../domain/catalog-item.entity';
import { ICatalogRepository } from '../domain/catalog.repository.interface';
import { PrismaService } from '../../infra/database/prisma.service';

@Injectable()
export class PrismaCatalogRepository implements ICatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(service: CatalogItem): Promise<void> {
    await this.prisma.catalogItemModel.upsert({
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

  async findById(id: string): Promise<CatalogItem | null> {
    const raw = await this.prisma.catalogItemModel.findUnique({ where: { id } });
    return raw ? new CatalogItem(raw) : null;
  }

  async findAll(active?: boolean): Promise<CatalogItem[]> {
    const records = await this.prisma.catalogItemModel.findMany({
      where: active === undefined ? undefined : { active },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return records.map((record) => new CatalogItem(record));
  }
}
