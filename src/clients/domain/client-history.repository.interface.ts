export interface ClientHistoryRecord {
  id: string;
  date: string;
  time: string;
  status: string;
  service: string;
  amountCents: number;
  paymentStatus: 'PENDENTE' | 'RECEBIDO';
  paymentMethod: 'PIX' | 'CARTAO' | 'DINHEIRO' | null;
  paymentId: string;
}

export interface IClientHistoryRepository {
  history(clientId: string): Promise<ClientHistoryRecord[]>;
}
