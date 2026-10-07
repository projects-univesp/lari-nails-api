import { CatalogItem, CatalogItemData } from '../domain/catalog-item.entity';
import { ICatalogRepository } from '../domain/catalog.repository.interface';
import { FindCatalogItemUseCase } from './find.catalog-item.usecase';

export class UpdateCatalogItemUseCase {
  constructor(private readonly repository: ICatalogRepository) {}

  async execute(
    id: string,
    data: Partial<
      Pick<
        CatalogItemData,
        | 'name'
        | 'category'
        | 'description'
        | 'priceCents'
        | 'durationMinutes'
        | 'active'
      >
    >,
  ): Promise<CatalogItem> {
    const current = await new FindCatalogItemUseCase(this.repository).execute(id);
    const updated = current.update(data);
    await this.repository.save(updated);
    return updated;
  }
}
