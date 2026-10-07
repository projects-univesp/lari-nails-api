import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import {
  AgendaBlock,
  AgendaBlockInput,
  BusinessHours,
} from '../domain/agenda.rules';
import { IAgendaRepository } from '../domain/agenda.repository.interface';

@Injectable()
export class PrismaAgendaRepository implements IAgendaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listBusinessHours(): Promise<BusinessHours[]> {
    const stored = await this.prisma.businessHoursModel.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });
    return Array.from({ length: 7 }, (_, dayOfWeek) => {
      const day = stored.find((item) => item.dayOfWeek === dayOfWeek);
      return day
        ? {
            dayOfWeek,
            isOpen: day.isOpen,
            openTime: day.openTime,
            closeTime: day.closeTime,
            lunchStart: day.lunchStart,
            lunchEnd: day.lunchEnd,
          }
        : {
            dayOfWeek,
            isOpen: false,
            openTime: null,
            closeTime: null,
            lunchStart: null,
            lunchEnd: null,
          };
    });
  }

  async replaceBusinessHours(hours: BusinessHours[]): Promise<void> {
    await this.prisma.$transaction(
      hours.map((day) =>
        this.prisma.businessHoursModel.upsert({
          where: { dayOfWeek: day.dayOfWeek },
          create: day,
          update: {
            isOpen: day.isOpen,
            openTime: day.openTime,
            closeTime: day.closeTime,
            lunchStart: day.lunchStart,
            lunchEnd: day.lunchEnd,
          },
        }),
      ),
    );
  }

  async listBlocks(from: string, to: string): Promise<AgendaBlock[]> {
    const records = await this.prisma.agendaBlockModel.findMany({
      where: { date: { gte: this.date(from), lte: this.date(to) } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    return records.map((record) => this.mapBlock(record));
  }

  async findBlock(id: string): Promise<AgendaBlock | null> {
    const record = await this.prisma.agendaBlockModel.findUnique({
      where: { id },
    });
    return record ? this.mapBlock(record) : null;
  }

  async createBlock(input: AgendaBlockInput): Promise<AgendaBlock> {
    const record = await this.prisma.agendaBlockModel.create({
      data: {
        reason: input.reason,
        date: this.date(input.date),
        startTime: input.startTime,
        endTime: input.endTime,
      },
    });
    return this.mapBlock(record);
  }

  async updateBlock(id: string, input: AgendaBlockInput): Promise<AgendaBlock> {
    const record = await this.prisma.agendaBlockModel.update({
      where: { id },
      data: {
        reason: input.reason,
        date: this.date(input.date),
        startTime: input.startTime,
        endTime: input.endTime,
      },
    });
    return this.mapBlock(record);
  }

  async deleteBlock(id: string): Promise<void> {
    await this.prisma.agendaBlockModel.delete({ where: { id } });
  }

  async listOccupied(
    from: string,
    to: string,
    excludeAppointmentId?: string,
  ): Promise<{ date: string; startTime: string; endTime: string }[]> {
    const records = await this.prisma.appointmentModel.findMany({
      where: {
        requestedDate: { gte: this.date(from), lte: this.date(to) },
        status: { in: ['AGUARDANDO', 'CONFIRMADO'] },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
      select: { requestedDate: true, requestedTime: true, endTime: true },
    });
    return records.map((record) => ({
      date: record.requestedDate.toISOString().slice(0, 10),
      startTime: record.requestedTime,
      endTime: record.endTime,
    }));
  }

  private date(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private mapBlock(record: {
    id: string;
    reason: string;
    date: Date;
    startTime: string;
    endTime: string;
    createdAt: Date;
    updatedAt: Date;
  }): AgendaBlock {
    return {
      id: record.id,
      reason: record.reason,
      date: record.date.toISOString().slice(0, 10),
      startTime: record.startTime,
      endTime: record.endTime,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
