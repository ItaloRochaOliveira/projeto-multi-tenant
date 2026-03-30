import type { AuthRequest } from "@/middleware/auth";
import TenantCrudService from "@/service/tenant/TenantCrudService";
import TypeORMTenantsRepository from "@/service/repository/typeorm/typeormTenants";
import type { NextFunction, Response } from "express";
import { IdParamSchema } from "../shared/idParamSchema";
import {
  CreateTenantBodySchema,
  UpdateTenantBodySchema,
} from "./schema/tenantCrudSchemas";

export default class TenantApiController {
  private service() {
    return new TenantCrudService(new TypeORMTenantsRepository());
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = CreateTenantBodySchema.parse(req.body);
      const result = await this.service().create({
        ...body,
        createdByUserId: req.user!.id,
      });
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service().listForTenant(req.user!.tenantId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const result = await this.service().getById(req.user!.tenantId, id);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const body = UpdateTenantBodySchema.parse(req.body);
      const result = await this.service().update(req.user!.tenantId, id, body);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };

  remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const result = await this.service().remove(req.user!.tenantId, id);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };
}
