import type { MedicalRecord } from "@/db/entities";
import type IRepository from "@/interfaces/IRepository";

export default interface MedicalRecordRepository extends IRepository<MedicalRecord> {
  findByTenant(tenantId: string): Promise<MedicalRecord[]>;
  findByTenantAndId(tenantId: string, id: string): Promise<MedicalRecord | null>;
  findByTenantAndPatientId(
    tenantId: string,
    patientId: string,
  ): Promise<MedicalRecord | null>;
}
