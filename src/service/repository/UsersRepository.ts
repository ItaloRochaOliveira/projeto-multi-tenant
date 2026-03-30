import type { User } from "@/db/entities";
import type IRepository from "@/interfaces/IRepository";

export default interface UsersRepository extends IRepository<User> {
  getByEmail(tenantId: string, email: string): Promise<User | null>;
  findByTenant(tenantId: string): Promise<User[]>;
}
