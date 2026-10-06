import { Service } from '../domain/service.entity';
import { IServiceRepository } from '../domain/service.repository.interface';

export class FindAllServiceUseCase {
  constructor(private readonly repository: IServiceRepository) {}

  execute(active?: boolean): Promise<Service[]> {
    return this.repository.findAll(active);
  }
}
