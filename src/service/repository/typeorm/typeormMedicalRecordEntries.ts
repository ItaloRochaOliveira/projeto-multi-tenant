import { MedicalRecordEntry } from "@/db/entities";
import { appDataSource } from "@/db/appDataSource";
import MedicalRecordEntryRepository from "../MedicalRecordEntryRepository";
import RepositoryModel from "../RepositoryModel";
import type { Repository } from "typeorm";

export default class TypeORMMedicalRecordEntryRepository
  extends RepositoryModel<MedicalRecordEntry>
  implements MedicalRecordEntryRepository
{
  protected readonly typeORM: Repository<MedicalRecordEntry> =
    appDataSource.getRepository(MedicalRecordEntry);

  findByTenant(tenantId: string): Promise<MedicalRecordEntry[]> {
    return this.typeORM.find({
      where: { tenantId },
      order: { recordedAt: "DESC" },
    });
  }

  findByTenantAndId(
    tenantId: string,
    id: string,
  ): Promise<MedicalRecordEntry | null> {
    return this.typeORM.findOne({ where: { id, tenantId } });
  }

  findByTenantAndRecordId(
    tenantId: string,
    medicalRecordId: string,
  ): Promise<MedicalRecordEntry[]> {
    return this.typeORM.find({
      where: { tenantId, medicalRecordId },
      order: { recordedAt: "DESC" },
    });
  }
}
