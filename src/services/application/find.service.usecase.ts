import { NotFoundException } from '@nestjs/common';
import { Service } from '../domain/service.entity';
import { IServiceRepository } from '../domain/service.repository.interface';

export class FindServiceUseCase {
  constructor(private readonly repository: IServiceRepository) {}

  async execute(id: string): Promise<Service> {
    const service = await this.repository.findById(id);
    if (!service) throw new NotFoundException('Serviço não encontrado');
    return service;
  }
}
