import { Service, ServiceData } from '../domain/service.entity';
import { IServiceRepository } from '../domain/service.repository.interface';
import { FindServiceUseCase } from './find.service.usecase';

export class UpdateServiceUseCase {
  constructor(private readonly repository: IServiceRepository) {}

  async execute(
    id: string,
    data: Partial<
      Pick<
        ServiceData,
        | 'name'
        | 'category'
        | 'description'
        | 'priceCents'
        | 'durationMinutes'
        | 'active'
      >
    >,
  ): Promise<Service> {
    const current = await new FindServiceUseCase(this.repository).execute(id);
    const updated = current.update(data);
    await this.repository.save(updated);
    return updated;
  }
}
