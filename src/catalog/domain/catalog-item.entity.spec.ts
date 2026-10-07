import { CatalogItem, CatalogItemValidationError } from './catalog-item.entity';

describe('CatalogItem Entity', () => {
  const data = {
    name: 'Manicure',
    category: 'Mãos',
    priceCents: 4500,
    durationMinutes: 60,
  };

  it('cria serviço ativo e atualiza preço e duração sem perder os outros dados', () => {
    const original = new CatalogItem(data);
    const updated = original.update({
      priceCents: 5000,
      durationMinutes: 75,
      active: false,
    });

    expect(updated.id).toBe(original.id);
    expect(updated.name).toBe('Manicure');
    expect(updated.priceCents).toBe(5000);
    expect(updated.durationMinutes).toBe(75);
    expect(updated.active).toBe(false);
    expect(original.active).toBe(true);
    expect(original.priceCents).toBe(4500);
  });

  it('rejeita valores inválidos mesmo sem passar pelo DTO HTTP', () => {
    expect(() => new CatalogItem({ ...data, priceCents: 4.5 })).toThrow(
      CatalogItemValidationError,
    );
    expect(() => new CatalogItem({ ...data, durationMinutes: 0 })).toThrow(
      CatalogItemValidationError,
    );
    expect(() => new CatalogItem({ ...data, name: '  ' })).toThrow(
      CatalogItemValidationError,
    );
    const service = new CatalogItem(data);
    expect(() => service.update({ durationMinutes: 1441 })).toThrow(
      CatalogItemValidationError,
    );
    expect(service.durationMinutes).toBe(60);
  });
});
