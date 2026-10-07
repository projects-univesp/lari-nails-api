import { CanonicalAutomationEvent } from '../domain/automation-event.entity';
import { IAutomationEventRepository } from '../domain/automation-event.repository.interface';
import {
  AutomationNotConfiguredError,
  AutomationNotFoundError,
} from '../domain/automation.errors';

export class VerifyAutomationEventUseCase {
  constructor(private readonly repository: IAutomationEventRepository) {}

  async execute(
    id: string,
    timestamp: string,
    signature: string,
  ): Promise<{ event: CanonicalAutomationEvent }> {
    const secret = process.env.AUTOMATION_EVENT_WEBHOOK_SECRET;
    if (!secret || secret.length < 32) {
      throw new AutomationNotConfiguredError('Webhook não configurado');
    }

    const event = await this.repository.findById(id);
    if (!event) {
      throw new AutomationNotFoundError('Evento não encontrado');
    }

    const canonical = event.verifySignature(timestamp, signature, secret);
    return { event: canonical };
  }
}
