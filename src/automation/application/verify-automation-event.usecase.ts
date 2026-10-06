import { createHmac, timingSafeEqual } from 'crypto';
import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';

@Injectable()
export class VerifyAutomationEventUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string, timestamp: string, signature: string) {
    const secret = process.env.AUTOMATION_EVENT_WEBHOOK_SECRET;
    if (!secret || secret.length < 32)
      throw new ServiceUnavailableException('Webhook não configurado');
    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(age) || age > 300)
      throw new UnauthorizedException('Evento expirado');
    const event = await this.prisma.automationEventModel.findUnique({
      where: { id },
    });
    if (!event) throw new NotFoundException('Evento não encontrado');
    const canonical = {
      id: event.id,
      type: event.type,
      aggregateId: event.aggregateId,
      payload: event.payload,
      createdAt: event.createdAt.toISOString(),
    };
    const expected = createHmac('sha256', secret)
      .update(`${timestamp}.${JSON.stringify(canonical)}`)
      .digest('hex');
    const provided = signature.slice('sha256='.length);
    if (
      !timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(provided, 'hex'),
      )
    ) {
      throw new UnauthorizedException('Assinatura inválida');
    }
    return { event: canonical };
  }
}
