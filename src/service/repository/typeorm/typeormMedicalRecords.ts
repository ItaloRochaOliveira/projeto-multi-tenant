import { MedicalRecord } from "@/db/entities";
import { appDataSource } from "@/db/appDataSource";
import MedicalRecordRepository from "../MedicalRecordRepository";
import RepositoryModel from "../RepositoryModel";
import type { Repository } from "typeorm";

export default class TypeORMMedicalRecordRepository
  extends RepositoryModel<MedicalRecord>
  implements MedicalRecordRepository
{
  protected readonly typeORM: Repository<MedicalRecord> =
    appDataSource.getRepository(MedicalRecord);

  findByTenant(tenantId: string): Promise<MedicalRecord[]> {
    return this.typeORM.find({ where: { tenantId } });
  }

  findByTenantAndId(tenantId: string, id: string): Promise<MedicalRecord | null> {
    return this.typeORM.findOne({ where: { id, tenantId } });
  }

  findByTenantAndPatientId(
    tenantId: string,
    patientId: string,
  ): Promise<MedicalRecord | null> {
    return this.typeORM.findOne({ where: { tenantId, patientId } });
  }
}
