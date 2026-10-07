import { CatalogItem, CatalogItemData } from '../domain/catalog-item.entity';
import { ICatalogRepository } from '../domain/catalog.repository.interface';

export class CreateCatalogItemUseCase {
  constructor(private readonly repository: ICatalogRepository) {}

  async execute(data: CatalogItemData): Promise<CatalogItem> {
    const service = new CatalogItem(data);
    await this.repository.save(service);
    return service;
  }
}
