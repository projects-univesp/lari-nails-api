import { Service } from '../../domain/service.entity';

export class ServicePresenter {
  static toHTTP(service: Service) {
    return {
      id: service.id,
      name: service.name,
      category: service.category,
      description: service.description,
      priceCents: service.priceCents,
      durationMinutes: service.durationMinutes,
      active: service.active,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      _links: {
        self: { href: `/services/${service.id}` },
        collection: { href: '/services' },
      },
    };
  }
}
