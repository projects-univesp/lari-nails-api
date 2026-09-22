import { randomUUID } from 'crypto';

export class Client {
  private id: string;
  private nome: string;
  private telefone: string;
  private status: string;
  private totalFaltas: number;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  constructor(
    nome: string,
    telefone: string,
    status: string = 'ativo',
    totalFaltas: number = 0,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt: Date | null = null,
  ) {
    this.id = id ?? randomUUID();
    this.nome = nome;
    this.telefone = telefone;
    this.status = status;
    this.totalFaltas = totalFaltas;
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

  getTelefone(): string {
    return this.telefone;
  }

  getStatus(): string {
    return this.status;
  }

  getTotalFaltas(): number {
    return this.totalFaltas;
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

  update(params: {
    nome?: string;
    telefone?: string;
    status?: string;
    totalFaltas?: number;
  }): void {
    if (params.nome !== undefined) {
      this.nome = params.nome;
    }
    if (params.telefone !== undefined) {
      this.telefone = params.telefone;
    }
    if (params.status !== undefined) {
      this.status = params.status;
    }
    if (params.totalFaltas !== undefined) {
      this.totalFaltas = params.totalFaltas;
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
    if (!this.isValidTelefone(this.telefone)) {
      throw new Error('Telefone Invalido');
    }
    if (!this.isValidStatus(this.status)) {
      throw new Error('Status Invalido');
    }
    if (!this.isValidTotalFaltas(this.totalFaltas)) {
      throw new Error('Total de faltas Invalido');
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

  private isValidTelefone(telefone: string): boolean {
    return (
      typeof telefone === 'string' &&
      telefone.trim().length > 0 &&
      telefone.length <= 20
    );
  }

  private isValidStatus(status: string): boolean {
    return (
      typeof status === 'string' &&
      status.trim().length > 0 &&
      status.length <= 20
    );
  }

  private isValidTotalFaltas(totalFaltas: number): boolean {
    return (
      typeof totalFaltas === 'number' &&
      Number.isInteger(totalFaltas) &&
      totalFaltas >= 0
    );
  }
}
