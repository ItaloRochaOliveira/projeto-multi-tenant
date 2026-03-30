import type { Patient } from "@/db/entities";
import type IRepository from "@/interfaces/IRepository";

export default interface PatientRepository extends IRepository<Patient> {
  findByTenant(tenantId: string, withDeleted?: boolean): Promise<Patient[]>;
  findByTenantAndId(tenantId: string, id: string): Promise<Patient | null>;
}
