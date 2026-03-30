import type { Tenant } from "@/db/entities";
import RepositoryModel from "./RepositoryModel";

export default interface TenantRepository extends RepositoryModel<Tenant> {
  getBySlug(slug: string): Promise<Tenant | null>;
}
