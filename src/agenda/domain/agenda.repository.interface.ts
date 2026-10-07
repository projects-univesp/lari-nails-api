import { AgendaBlock, AgendaBlockInput, BusinessHours } from './agenda.rules';

export interface IAgendaRepository {
  listBusinessHours(): Promise<BusinessHours[]>;
  replaceBusinessHours(hours: BusinessHours[]): Promise<void>;
  listBlocks(from: string, to: string): Promise<AgendaBlock[]>;
  findBlock(id: string): Promise<AgendaBlock | null>;
  createBlock(input: AgendaBlockInput): Promise<AgendaBlock>;
  updateBlock(id: string, input: AgendaBlockInput): Promise<AgendaBlock>;
  deleteBlock(id: string): Promise<void>;
  listOccupied(
    from: string,
    to: string,
    excludeAppointmentId?: string,
  ): Promise<{ date: string; startTime: string; endTime: string }[]>;
}
