import IServiceModel from "@/interfaces/IServiceModel";
import NotFound from "@/utils/errors/NotFound";
import type TenantRepository from "./repository/TenantRepository";

export interface GetTenantBySlugInput {
  slug: string;
}

/** Dados públicos da instituição (sem metadata interna). */
export type TenantPublic = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export default class GetTenantBySlugService
  implements IServiceModel<GetTenantBySlugInput, TenantPublic>
{
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(data: GetTenantBySlugInput) {
    const tenant = await this.tenantRepository.getBySlug(data.slug);
    if (!tenant?.isActive) {
      throw new NotFound("Instituição não encontrada");
    }

    const body: TenantPublic = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      isActive: tenant.isActive,
    };

    return {
      status: "success",
      message: {
        code: 200,
        message: body,
      },
    };
  }
}
