import { IClientTagRepository } from '../domain/client-tag.repository.interface';

export class ListClientTagsUseCase {
  constructor(private readonly repository: IClientTagRepository) {}

  execute(): Promise<string[]> {
    return this.repository.list();
  }
}

export class CreateClientTagUseCase {
  constructor(private readonly repository: IClientTagRepository) {}

  execute(name: string): Promise<string> {
    return this.repository.create(name);
  }
}

export class DeleteClientTagUseCase {
  constructor(private readonly repository: IClientTagRepository) {}

  execute(name: string): Promise<void> {
    return this.repository.delete(name);
  }
}
