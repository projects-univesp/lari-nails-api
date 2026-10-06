import { Client } from './client.entity';

export interface IClientPhoneRepository {
  resolvePhone(
    nome: string,
    telefone: string,
  ): Promise<{ client: Client; created: boolean }>;
}
