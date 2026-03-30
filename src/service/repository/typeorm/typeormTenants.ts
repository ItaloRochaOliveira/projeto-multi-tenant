import { Tenant } from "@/db/entities";
import { appDataSource } from "@/db/appDataSource";
import TenantRepository from "../TenantRepository";
import RepositoryModel from "../RepositoryModel";
import type { Repository } from "typeorm";

export default class TypeORMTenantsRepository
  extends RepositoryModel<Tenant>
  implements TenantRepository
{
  protected readonly typeORM: Repository<Tenant> =
    appDataSource.getRepository(Tenant);

  getBySlug(slug: string): Promise<Tenant | null> {
    return this.typeORM.findOne({ where: { slug } });
  }
}
