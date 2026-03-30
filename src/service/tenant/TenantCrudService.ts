import type { Tenant } from "@/db/entities";
import type TenantRepository from "@/service/repository/TenantRepository";
import BadRequest from "@/utils/errors/BadRequest";
import Forbidden from "@/utils/errors/Forbidden";
import NotFound from "@/utils/errors/NotFound";
import { v4 as uuidv4 } from "uuid";
import type { ServicePromise } from "@/interfaces/IServiceModel";
import { ok } from "@/utils/apiResponse";

/** Entrada da API: campos opcionais podem vir ausentes (`undefined`), ao contrário de `Tenant`. */
export type CreateTenantInput = {
  name: string;
  slug: string;
  legalName?: string | null;
  document?: string | null;
  metadata?: Record<string, unknown> | null;
  isActive?: boolean;
  /** Quem está a criar o tenant (JWT); grava em `created_by_user_id`. */
  createdByUserId?: string | null;
};

export type UpdateTenantInput = Partial<
  Pick<
    Tenant,
    "name" | "legalName" | "slug" | "document" | "metadata" | "isActive"
  >
>;

export default class TenantCrudService {
  constructor(private readonly repo: TenantRepository) {}

  async create(data: CreateTenantInput): ServicePromise<Tenant> {
    const slugTaken = await this.repo.getBySlug(data.slug);
    if (slugTaken) {
      throw new BadRequest("Slug já está em uso");
    }
    const tenant = {
      id: uuidv4(),
      name: data.name,
      legalName: data.legalName ?? null,
      slug: data.slug,
      document: data.document ?? null,
      metadata: data.metadata ?? null,
      isActive: data.isActive ?? true,
      createdByUserId: data.createdByUserId ?? null,
    } as Tenant;
    const saved = await this.repo.create(tenant);
    if (!saved) throw new BadRequest("Não foi possível criar a instituição");
    return ok(201, saved);
  }

  async listForTenant(tenantId: string): ServicePromise<Tenant[]> {
    const t = await this.repo.getById(tenantId);
    if (!t) throw new NotFound("Instituição não encontrada");
    return ok(200, [t]);
  }

  async getById(tenantId: string, id: string): ServicePromise<Tenant> {
    if (id !== tenantId) {
      throw new Forbidden("Acesso negado a outra instituição");
    }
    const t = await this.repo.getById(id);
    if (!t) throw new NotFound("Instituição não encontrada");
    return ok(200, t);
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateTenantInput,
  ): ServicePromise<Tenant> {
    if (id !== tenantId) {
      throw new Forbidden("Acesso negado a outra instituição");
    }
    if (data.slug) {
      const other = await this.repo.getBySlug(data.slug);
      if (other && other.id !== id) {
        throw new BadRequest("Slug já está em uso");
      }
    }
    const result = await this.repo.edit(id, data);
    if (!result.affected) throw new NotFound("Instituição não encontrada");
    const updated = await this.repo.getById(id);
    return ok(200, updated!);
  }

  async remove(tenantId: string, id: string): ServicePromise<Tenant> {
    if (id !== tenantId) {
      throw new Forbidden("Acesso negado a outra instituição");
    }
    await this.repo.edit(id, { isActive: false });
    const t = await this.repo.getById(id);
    return ok(200, t!);
  }
}
