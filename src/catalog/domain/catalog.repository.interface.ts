import { CatalogItem } from './catalog-item.entity';

export interface ICatalogRepository {
  save(service: CatalogItem): Promise<void>;
  findById(id: string): Promise<CatalogItem | null>;
  findAll(active?: boolean): Promise<CatalogItem[]>;
}
