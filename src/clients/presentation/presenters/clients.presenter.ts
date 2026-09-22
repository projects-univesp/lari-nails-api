import { Client } from '../../domain/client.entity';

export class ClientPresenter {
  static toHTTP(client: Client) {
    return {
      id: client.getId(),
      nome: client.getNome(),
      telefone: client.getTelefone(),
      status: client.getStatus(),
      totalFaltas: client.getTotalFaltas(),
      createdAt: client.getCreatedAt(),
      updatedAt: client.getUpdatedAt(),
      _links: {
        self: { href: `/clients/${client.getId()}` },
        collection: { href: `/clients` },
      },
    };
  }
}
