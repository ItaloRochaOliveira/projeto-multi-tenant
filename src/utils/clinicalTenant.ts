import type { AuthRequest } from "@/middleware/auth";
import TypeORMTenantsRepository from "@/service/repository/typeorm/typeormTenants";
import Forbidden from "@/utils/errors/Forbidden";
import NotFound from "@/utils/errors/NotFound";

/**
 * Tenant efetivo para dados clínicos: JWT (`req.user.tenantId`) ou header `X-Tenant-Id`.
 * Admin pode usar qualquer tenant existente; staff só tenants que criou (`created_by_user_id`).
 */
export async function resolveClinicalTenantId(req: AuthRequest): Promise<string> {
  const user = req.user;
  if (!user) {
    throw new Forbidden("Autenticação obrigatória");
  }
  const raw = req.headers["x-tenant-id"];
  const headerId = typeof raw === "string" ? raw.trim() : "";
  if (!headerId) {
    return user.tenantId;
  }

  const repo = new TypeORMTenantsRepository();
  const tenant = await repo.getById(headerId);
  if (!tenant) {
    throw new NotFound("Instituição (tenant) não encontrada");
  }

  const uid = user.id;
  const role = user.role;

  if (role === "admin") {
    return tenant.id;
  }
  if (tenant.createdByUserId === uid) {
    return tenant.id;
  }
  throw new Forbidden("Sem permissão para operar neste tenant");
}
