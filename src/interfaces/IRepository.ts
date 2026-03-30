import type { DeleteResult, UpdateResult } from "typeorm";

export default interface ITypeorm<T> {
  getAll(): Promise<T[] | null>;
  getById(id: string): Promise<T | null>;
  getByUserId(userId: string): Promise<T[] | null>;
  create(entity: T): Promise<T | null>;
  edit(id: string, entity: Partial<T>): Promise<UpdateResult>;
  delete(id: string): Promise<DeleteResult>;
}
