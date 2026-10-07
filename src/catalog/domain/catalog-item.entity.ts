import { randomUUID } from 'crypto';

export class CatalogItemValidationError extends Error {}

export interface CatalogItemData {
  name: string;
  category: string;
  description?: string | null;
  priceCents: number;
  durationMinutes: number;
  active?: boolean;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CatalogItem {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly description: string | null;
  readonly priceCents: number;
  readonly durationMinutes: number;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: CatalogItemData) {
    this.id = data.id ?? randomUUID();
    this.name = data.name;
    this.category = data.category;
    this.description = data.description ?? null;
    this.priceCents = data.priceCents;
    this.durationMinutes = data.durationMinutes;
    this.active = data.active ?? true;
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
    this.validate();
  }

  update(
    data: Partial<
      Pick<
        CatalogItemData,
        | 'name'
        | 'category'
        | 'description'
        | 'priceCents'
        | 'durationMinutes'
        | 'active'
      >
    >,
  ): CatalogItem {
    return new CatalogItem({
      id: this.id,
      name: data.name ?? this.name,
      category: data.category ?? this.category,
      description:
        data.description === undefined ? this.description : data.description,
      priceCents: data.priceCents ?? this.priceCents,
      durationMinutes: data.durationMinutes ?? this.durationMinutes,
      active: data.active ?? this.active,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  private validate(): void {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        this.id,
      )
    ) {
      throw new CatalogItemValidationError('ID inválido');
    }
    if (
      typeof this.name !== 'string' ||
      !this.name.trim() ||
      this.name.length > 120
    ) {
      throw new CatalogItemValidationError('Nome do serviço inválido');
    }
    if (
      typeof this.category !== 'string' ||
      !this.category.trim() ||
      this.category.length > 80
    ) {
      throw new CatalogItemValidationError('Categoria do serviço inválida');
    }
    if (
      this.description !== null &&
      (typeof this.description !== 'string' || this.description.length > 5000)
    ) {
      throw new CatalogItemValidationError('Descrição do serviço inválida');
    }
    if (
      !Number.isSafeInteger(this.priceCents) ||
      this.priceCents < 0 ||
      this.priceCents > 2147483647
    ) {
      throw new CatalogItemValidationError('Preço em centavos inválido');
    }
    if (
      !Number.isSafeInteger(this.durationMinutes) ||
      this.durationMinutes < 1 ||
      this.durationMinutes > 1440
    ) {
      throw new CatalogItemValidationError('Duração em minutos inválida');
    }
    if (typeof this.active !== 'boolean') {
      throw new CatalogItemValidationError('Status ativo inválido');
    }
  }
}
