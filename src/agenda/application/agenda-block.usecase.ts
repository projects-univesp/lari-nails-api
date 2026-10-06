import { NotFoundException } from '@nestjs/common';
import {
  AgendaBlock,
  AgendaBlockInput,
  assertDate,
  validateAgendaBlock,
  AgendaValidationError,
} from '../domain/agenda.rules';
import { IAgendaRepository } from '../domain/agenda.repository.interface';

export class AgendaBlockUseCase {
  constructor(private readonly repository: IAgendaRepository) {}

  list(from: string, to: string): Promise<AgendaBlock[]> {
    assertDate(from);
    assertDate(to);
    if (from > to)
      throw new AgendaValidationError('O início deve ocorrer antes do fim');
    return this.repository.listBlocks(from, to);
  }

  create(input: AgendaBlockInput): Promise<AgendaBlock> {
    validateAgendaBlock(input);
    return this.repository.createBlock(input);
  }

  async update(
    id: string,
    input: Partial<AgendaBlockInput>,
  ): Promise<AgendaBlock> {
    const current = await this.repository.findBlock(id);
    if (!current) throw new NotFoundException('Bloqueio não encontrado');
    const next = {
      reason: input.reason ?? current.reason,
      date: input.date ?? current.date,
      startTime: input.startTime ?? current.startTime,
      endTime: input.endTime ?? current.endTime,
    };
    validateAgendaBlock(next);
    return this.repository.updateBlock(id, next);
  }

  async delete(id: string): Promise<void> {
    const current = await this.repository.findBlock(id);
    if (!current) throw new NotFoundException('Bloqueio não encontrado');
    await this.repository.deleteBlock(id);
  }
}
