import { Inject, Injectable } from '@nestjs/common';
import type { ClientHistoryRecord, IClientHistoryRepository } from '../domain/client-history.repository.interface';

@Injectable()
export class FindClientHistoryUseCase {
  constructor(@Inject('IClientHistoryRepository') private readonly repository: IClientHistoryRepository) {}
  execute(clientId: string): Promise<ClientHistoryRecord[]> { return this.repository.history(clientId); }
}
