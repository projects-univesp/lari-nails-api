import { Service } from './service.entity';

export interface IServiceRepository {
  save(service: Service): Promise<void>;
  findById(id: string): Promise<Service | null>;
  findAll(active?: boolean): Promise<Service[]>;
}
