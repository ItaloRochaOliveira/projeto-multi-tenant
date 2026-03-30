import type { MedicalRecordEntry } from "@/db/entities";
import type IRepository from "@/interfaces/IRepository";

export default interface MedicalRecordEntryRepository
  extends IRepository<MedicalRecordEntry>
{
  findByTenant(tenantId: string): Promise<MedicalRecordEntry[]>;
  findByTenantAndId(
    tenantId: string,
    id: string,
  ): Promise<MedicalRecordEntry | null>;
  findByTenantAndRecordId(
    tenantId: string,
    medicalRecordId: string,
  ): Promise<MedicalRecordEntry[]>;
}
