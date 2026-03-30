import { Consultation } from "@/db/entities";
import { appDataSource } from "@/db/appDataSource";
import ConsultationRepository from "../ConsultationRepository";
import RepositoryModel from "../RepositoryModel";
import type { DeleteResult, Repository } from "typeorm";

export default class TypeORMConsultationRepository
  extends RepositoryModel<Consultation>
  implements ConsultationRepository
{
  protected readonly typeORM: Repository<Consultation> =
    appDataSource.getRepository(Consultation);

  findByTenant(tenantId: string): Promise<Consultation[]> {
    return this.typeORM.find({
      where: { tenantId },
      order: { scheduledAt: "DESC" },
    });
  }

  findByTenantAndId(tenantId: string, id: string): Promise<Consultation | null> {
    return this.typeORM.findOne({ where: { id, tenantId } });
  }

  override async delete(id: string): Promise<DeleteResult> {
    const r = await this.typeORM.softDelete(id);
    return { affected: r.affected ?? 0, raw: r.raw };
  }
}
