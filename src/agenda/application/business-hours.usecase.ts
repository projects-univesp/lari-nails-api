import { BusinessHours, validateBusinessHours } from '../domain/agenda.rules';
import { IAgendaRepository } from '../domain/agenda.repository.interface';

export class BusinessHoursUseCase {
  constructor(private readonly repository: IAgendaRepository) {}

  list(): Promise<BusinessHours[]> {
    return this.repository.listBusinessHours();
  }

  async replace(hours: BusinessHours[]): Promise<BusinessHours[]> {
    validateBusinessHours(hours);
    await this.repository.replaceBusinessHours(hours);
    return this.repository.listBusinessHours();
  }
}
