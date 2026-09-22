import { User } from '../../domain/user.entity';

export class UserPresenter {
  static toHTTP(user: User) {
    return {
      id: user.getId(),
      nome: user.getNome(),
      email: user.getEmail(),
      role: user.getRole(),
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
      _links: {
        self: { href: `/users/${user.getId()}` },
        collection: { href: '/users' },
      },
    };
  }
}
