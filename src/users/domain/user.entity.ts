import { randomUUID } from 'crypto';

export class User {
  private id: string;
  private nome: string;
  private email: string;
  private senha: string;
  private role: string;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  constructor(
    nome: string,
    email: string,
    senha: string,
    role: string = 'admin',
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt: Date | null = null,
  ) {
    this.id = id ?? randomUUID();
    this.nome = nome;
    this.email = email;
    this.senha = senha;
    this.role = role;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
    this.deletedAt = deletedAt;

    this.validate();
  }

  getId(): string {
    return this.id;
  }

  getNome(): string {
    return this.nome;
  }

  getEmail(): string {
    return this.email;
  }

  getSenha(): string {
    return this.senha;
  }

  getRole(): string {
    return this.role;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  markAsDeleted(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  update(params: { nome?: string; senha?: string; role?: string }): void {
    if (params.nome !== undefined) {
      this.nome = params.nome;
    }
    if (params.senha !== undefined) {
      this.senha = params.senha;
    }
    if (params.role !== undefined) {
      this.role = params.role;
    }
    this.updatedAt = new Date();
    this.validate();
  }

  restore(): void {
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  private validate(): void {
    if (!this.isValidId(this.id)) {
      throw new Error('ID Invalido');
    }
    if (!this.isValidNome(this.nome)) {
      throw new Error('Nome Invalido');
    }
    if (!this.isValidEmail(this.email)) {
      throw new Error('Email Invalido');
    }
    if (!this.isValidSenha(this.senha)) {
      throw new Error('Senha Invalida');
    }
    if (!this.isValidRole(this.role)) {
      throw new Error('Role Invalida');
    }
  }

  private isValidId(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  private isValidNome(nome: string): boolean {
    return (
      typeof nome === 'string' && nome.trim().length > 0 && nome.length <= 120
    );
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      typeof email === 'string' &&
      email.length <= 180 &&
      emailRegex.test(email.trim())
    );
  }

  private isValidSenha(senha: string): boolean {
    return typeof senha === 'string' && senha.trim().length > 0;
  }

  private isValidRole(role: string): boolean {
    return (
      typeof role === 'string' &&
      ['admin', 'colaborador'].includes(role.toLowerCase().trim())
    );
  }
}
