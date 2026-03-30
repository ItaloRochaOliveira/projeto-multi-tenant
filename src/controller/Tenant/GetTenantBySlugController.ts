import GetTenantBySlugService from "@/service/GetTenantBySlugService";
import TypeORMTenantsRepository from "@/service/repository/typeorm/typeormTenants";
import type { NextFunction, Request, Response } from "express";
import { GetTenantBySlugSchema } from "./schema/GetTenantBySlugSchema";

export default class GetTenantBySlugController {
  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = GetTenantBySlugSchema.parse(req.params);
      const tenantRepository = new TypeORMTenantsRepository();
      const service = new GetTenantBySlugService(tenantRepository);
      const result = await service.execute({ slug });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
