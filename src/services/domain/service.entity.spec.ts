import { Service, ServiceValidationError } from './service.entity';

describe('Service Entity', () => {
  const data = {
    name: 'Manicure',
    category: 'Mãos',
    priceCents: 4500,
    durationMinutes: 60,
  };

  it('cria serviço ativo e atualiza preço e duração sem perder os outros dados', () => {
    const original = new Service(data);
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
    expect(() => new Service({ ...data, priceCents: 4.5 })).toThrow(
      ServiceValidationError,
    );
    expect(() => new Service({ ...data, durationMinutes: 0 })).toThrow(
      ServiceValidationError,
    );
    expect(() => new Service({ ...data, name: '  ' })).toThrow(
      ServiceValidationError,
    );
    const service = new Service(data);
    expect(() => service.update({ durationMinutes: 1441 })).toThrow(
      ServiceValidationError,
    );
    expect(service.durationMinutes).toBe(60);
  });
});
