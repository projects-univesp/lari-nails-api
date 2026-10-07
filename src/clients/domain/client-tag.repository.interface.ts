export interface IClientTagRepository {
  list(): Promise<string[]>;
  create(name: string): Promise<string>;
  delete(name: string): Promise<void>;
}
