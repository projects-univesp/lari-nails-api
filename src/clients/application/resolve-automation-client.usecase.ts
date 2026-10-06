import { IClientPhoneRepository } from '../domain/client-phone.repository.interface';

export class ResolveAutomationClientUseCase {
  constructor(private readonly repository: IClientPhoneRepository) {}

  execute(nome: string, telefone: string) {
    return this.repository.resolvePhone(nome, telefone);
  }
}
