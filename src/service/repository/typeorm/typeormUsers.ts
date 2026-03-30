import { User } from "@/db/entities";
import { appDataSource } from "@/db/appDataSource";
import UsersRepository from "../UsersRepository";
import RepositoryModel from "../RepositoryModel";
import type { Repository } from "typeorm";

export default class TypeORMUsersRepository
  extends RepositoryModel<User>
  implements UsersRepository
{
  protected readonly typeORM: Repository<User> = appDataSource.getRepository(User);

  getByEmail(tenantId: string, email: string): Promise<User | null> {
    return this.typeORM.findOne({ where: { tenantId, email } });
  }

  findByTenant(tenantId: string): Promise<User[]> {
    return this.typeORM.find({
      where: { tenantId },
      order: { fullName: "ASC" },
    });
  }
}
