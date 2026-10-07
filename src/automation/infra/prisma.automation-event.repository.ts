import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { AutomationEvent } from '../domain/automation-event.entity';
import {
  IAutomationEventRepository,
  PendingAutomationEvent,
} from '../domain/automation-event.repository.interface';

@Injectable()
export class PrismaAutomationEventRepository
  implements IAutomationEventRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AutomationEvent | null> {
    const raw = await this.prisma.automationEventModel.findUnique({
      where: { id },
    });
    if (!raw) return null;
    return new AutomationEvent({
      id: raw.id,
      type: raw.type,
      aggregateId: raw.aggregateId,
      payload: raw.payload,
      createdAt: raw.createdAt,
    });
  }

  async findDue(now: Date, limit: number): Promise<PendingAutomationEvent[]> {
    const events = await this.prisma.automationEventModel.findMany({
      where: {
        deliveredAt: null,
        nextAttemptAt: { lte: now },
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return events.map((event) => ({
      id: event.id,
      type: event.type,
      aggregateId: event.aggregateId,
      payload: event.payload,
      createdAt: event.createdAt,
      attempts: event.attempts,
    }));
  }

  async claim(id: string, now: Date, lockUntil: Date): Promise<boolean> {
    const claimed = await this.prisma.automationEventModel.updateMany({
      where: {
        id,
        deliveredAt: null,
        nextAttemptAt: { lte: now },
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
      },
      data: { lockedUntil: lockUntil },
    });
    return claimed.count === 1;
  }

  async markDelivered(id: string): Promise<void> {
    await this.prisma.automationEventModel.update({
      where: { id },
      data: { deliveredAt: new Date(), lockedUntil: null, lastError: null },
    });
  }

  async markFailed(
    id: string,
    nextAttemptAt: Date,
    lastError: string,
  ): Promise<void> {
    await this.prisma.automationEventModel.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
        nextAttemptAt,
        lockedUntil: null,
        lastError: lastError.slice(0, 500),
      },
    });
  }
}
