import { NotFoundException } from '@nestjs/common';
import { CatalogItem } from '../domain/catalog-item.entity';
import { ICatalogRepository } from '../domain/catalog.repository.interface';

export class FindCatalogItemUseCase {
  constructor(private readonly repository: ICatalogRepository) {}

  async execute(id: string): Promise<CatalogItem> {
    const service = await this.repository.findById(id);
    if (!service) throw new NotFoundException('Serviço não encontrado');
    return service;
  }
}
