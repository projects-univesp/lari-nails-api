import { Service, ServiceData } from '../domain/service.entity';
import { IServiceRepository } from '../domain/service.repository.interface';

export class CreateServiceUseCase {
  constructor(private readonly repository: IServiceRepository) {}

  async execute(data: ServiceData): Promise<Service> {
    const service = new Service(data);
    await this.repository.save(service);
    return service;
  }
}
