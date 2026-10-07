import { CatalogItem } from '../domain/catalog-item.entity';
import { ICatalogRepository } from '../domain/catalog.repository.interface';

export class FindAllCatalogItemUseCase {
  constructor(private readonly repository: ICatalogRepository) {}

  execute(active?: boolean): Promise<CatalogItem[]> {
    return this.repository.findAll(active);
  }
}
