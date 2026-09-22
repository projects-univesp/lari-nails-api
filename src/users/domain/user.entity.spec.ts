import { User } from './user.entity';

describe('User Entity', () => {
  it('deve criar uma instancia valida de User com valores padrao', () => {
    const user = new User(
      'Administrador',
      'admin@larinails.com',
      'hashed-password-123',
    );

    expect(user.getId()).toBeDefined();
    expect(user.getNome()).toBe('Administrador');
    expect(user.getEmail()).toBe('admin@larinails.com');
    expect(user.getSenha()).toBe('hashed-password-123');
    expect(user.getRole()).toBe('admin');
    expect(user.getCreatedAt()).toBeInstanceOf(Date);
    expect(user.getUpdatedAt()).toBeInstanceOf(Date);
  });

  it('deve criar uma instancia valida de User com valores personalizados', () => {
    const customId = 'a0342504-9ef7-4387-9880-b9b8152bc14a';
    const createdAt = new Date('2026-01-01');
    const updatedAt = new Date('2026-01-02');

    const user = new User(
      'Saymon Dev',
      'saymon@larinails.com',
      'hashed-password-456',
      'colaborador',
      customId,
      createdAt,
      updatedAt,
    );

    expect(user.getId()).toBe(customId);
    expect(user.getRole()).toBe('colaborador');
    expect(user.getCreatedAt()).toEqual(createdAt);
    expect(user.getUpdatedAt()).toEqual(updatedAt);
  });

  it('deve lancar erro para id invalido', () => {
    expect(
      () => new User('Admin', 'admin@mail.com', 'hash', 'admin', 'invalid-id'),
    ).toThrow('ID Invalido');
  });

  it('deve lancar erro para nome vazio ou maior que 120 caracteres', () => {
    expect(() => new User('', 'admin@mail.com', 'hash')).toThrow(
      'Nome Invalido',
    );
    expect(() => new User('a'.repeat(121), 'admin@mail.com', 'hash')).toThrow(
      'Nome Invalido',
    );
  });

  it('deve lancar erro para email invalido', () => {
    expect(() => new User('Admin', 'invalid-email', 'hash')).toThrow(
      'Email Invalido',
    );
    expect(() => new User('Admin', '', 'hash')).toThrow('Email Invalido');
  });

  it('deve lancar erro para senha vazia', () => {
    expect(() => new User('Admin', 'admin@mail.com', '')).toThrow(
      'Senha Invalida',
    );
  });

  it('deve lancar erro para perfil (role) invalido', () => {
    expect(
      () => new User('Admin', 'admin@mail.com', 'hash', 'invalid-role'),
    ).toThrow('Role Invalida');
  });

  it('deve marcar o usuario como deletado (soft delete)', () => {
    const user = new User('Admin', 'admin@mail.com', 'hash');
    expect(user.isDeleted()).toBe(false);
    expect(user.getDeletedAt()).toBeNull();

    user.markAsDeleted();

    expect(user.isDeleted()).toBe(true);
    expect(user.getDeletedAt()).toBeInstanceOf(Date);
  });

  it('deve restaurar um usuario deletado com sucesso', () => {
    const user = new User('Admin', 'admin@mail.com', 'hash');
    user.markAsDeleted();
    expect(user.isDeleted()).toBe(true);

    user.restore();

    expect(user.isDeleted()).toBe(false);
    expect(user.getDeletedAt()).toBeNull();
  });

  it('deve atualizar os dados do usuario corretamente', () => {
    const user = new User('Admin', 'admin@mail.com', 'hash');
    user.update({
      nome: 'Admin Atualizado',
      senha: 'new-hash',
      role: 'colaborador',
    });

    expect(user.getNome()).toBe('Admin Atualizado');
    expect(user.getSenha()).toBe('new-hash');
    expect(user.getRole()).toBe('colaborador');
  });
});
