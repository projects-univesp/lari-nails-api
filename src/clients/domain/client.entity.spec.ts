import { Client } from './client.entity';

describe('Client Entity', () => {
  it('Deve criar uma instancia valida de Client com valores padrao', () => {
    const client = new Client('Maria da Silva', '(11) 98765-4321');

    expect(client.getId()).toBeDefined();
    expect(client.getNome()).toBe('Maria da Silva');
    expect(client.getTelefone()).toBe('(11) 98765-4321');
    expect(client.getEmail()).toBeNull();
    expect(client.getDataNasc()).toBeNull();
    expect(client.getStatus()).toBe('ativo');
    expect(client.getTotalFaltas()).toBe(0);
    expect(client.getCreatedAt()).toBeInstanceOf(Date);
    expect(client.getUpdatedAt()).toBeInstanceOf(Date);
  });

  it('Deve criar uma instancia valida de Client com valores personalizados', () => {
    const customId = 'dabea031-504f-43b6-86d0-8c1b843ef8e4';
    const dataNasc = new Date('1990-05-20');
    const client = new Client(
      'Joao Pereira',
      '(11) 91234-5678',
      'joao@example.com',
      dataNasc,
      'inativo',
      3,
      customId,
    );

    expect(client.getId()).toBe(customId);
    expect(client.getNome()).toBe('Joao Pereira');
    expect(client.getTelefone()).toBe('(11) 91234-5678');
    expect(client.getEmail()).toBe('joao@example.com');
    expect(client.getDataNasc()).toBe(dataNasc);
    expect(client.getStatus()).toBe('inativo');
    expect(client.getTotalFaltas()).toBe(3);
  });

  it('Deve lancar erro ao passar um ID invalido', () => {
    expect(
      () =>
        new Client(
          'Maria da Silva',
          '(11) 98765-4321',
          null,
          null,
          'ativo',
          0,
          '1234',
        ),
    ).toThrow('ID Invalido');
  });

  it('Deve lancar erro ao passar nome vazio ou maior que 120 caracteres', () => {
    expect(() => new Client('', '(11) 98765-4321')).toThrow('Nome Invalido');
    expect(() => new Client('   ', '(11) 98765-4321')).toThrow('Nome Invalido');
    expect(() => new Client('a'.repeat(121), '(11) 98765-4321')).toThrow(
      'Nome Invalido',
    );
  });

  it('Deve lancar erro ao passar telefone vazio ou maior que 20 caracteres', () => {
    expect(() => new Client('Maria', '')).toThrow('Telefone Invalido');
    expect(() => new Client('Maria', '   ')).toThrow('Telefone Invalido');
    expect(() => new Client('Maria', '1'.repeat(21))).toThrow(
      'Telefone Invalido',
    );
  });

  it('Deve aceitar email nulo (opcional)', () => {
    const client = new Client('Maria', '(11) 98765-4321', null);
    expect(client.getEmail()).toBeNull();
  });

  it('Deve lancar erro ao passar email em formato invalido', () => {
    expect(
      () => new Client('Maria', '(11) 98765-4321', 'email-invalido'),
    ).toThrow('Email Invalido');
  });

  it('Deve lancar erro se total de faltas for negativo ou nao for inteiro', () => {
    expect(() => new Client('Maria', '12345', null, null, 'ativo', -1)).toThrow(
      'Total de faltas Invalido',
    );
    expect(
      () => new Client('Maria', '12345', null, null, 'ativo', 1.5),
    ).toThrow('Total de faltas Invalido');
  });

  it('Deve atualizar email e dataNasc via update', () => {
    const client = new Client('Maria da Silva', '(11) 98765-4321');
    const novaData = new Date('1995-01-10');

    client.update({ email: 'maria@example.com', dataNasc: novaData });

    expect(client.getEmail()).toBe('maria@example.com');
    expect(client.getDataNasc()).toBe(novaData);
  });

  it('Deve marcar cliente como deletado corretamente (soft delete)', () => {
    const client = new Client('Maria da Silva', '(11) 98765-4321');
    expect(client.isDeleted()).toBe(false);
    expect(client.getDeletedAt()).toBeNull();

    client.markAsDeleted();

    expect(client.isDeleted()).toBe(true);
    expect(client.getDeletedAt()).toBeInstanceOf(Date);
  });
});
