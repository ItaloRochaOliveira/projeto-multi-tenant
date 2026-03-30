import type { Consultation } from "@/db/entities";
import type IRepository from "@/interfaces/IRepository";

export default interface ConsultationRepository extends IRepository<Consultation> {
  findByTenant(tenantId: string): Promise<Consultation[]>;
  findByTenantAndId(tenantId: string, id: string): Promise<Consultation | null>;
}
