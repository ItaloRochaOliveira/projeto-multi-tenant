import { Patient } from "@/db/entities";
import { appDataSource } from "@/db/appDataSource";
import PatientRepository from "../PatientRepository";
import RepositoryModel from "../RepositoryModel";
import type { DeleteResult, Repository } from "typeorm";

export default class TypeORMPatientRepository
  extends RepositoryModel<Patient>
  implements PatientRepository
{
  protected readonly typeORM: Repository<Patient> =
    appDataSource.getRepository(Patient);

  findByTenant(tenantId: string, withDeleted = false): Promise<Patient[]> {
    return this.typeORM.find({
      where: { tenantId },
      withDeleted,
      order: { fullName: "ASC" },
    });
  }

  findByTenantAndId(tenantId: string, id: string): Promise<Patient | null> {
    return this.typeORM.findOne({ where: { id, tenantId } });
  }

  override async delete(id: string): Promise<DeleteResult> {
    const r = await this.typeORM.softDelete(id);
    return { affected: r.affected ?? 0, raw: r.raw };
  }
}
