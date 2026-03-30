import type { AuthRequest } from "@/middleware/auth";
import ConsultationCrudService from "@/service/consultation/ConsultationCrudService";
import { resolveClinicalTenantId } from "@/utils/clinicalTenant";
import TypeORMConsultationRepository from "@/service/repository/typeorm/typeormConsultations";
import TypeORMPatientRepository from "@/service/repository/typeorm/typeormPatients";
import TypeORMUsersRepository from "@/service/repository/typeorm/typeormUsers";
import type { NextFunction, Response } from "express";
import { IdParamSchema } from "../shared/idParamSchema";
import {
  CreateConsultationBodySchema,
  UpdateConsultationBodySchema,
} from "./schema/consultationCrudSchemas";

export default class ConsultationApiController {
  private service() {
    return new ConsultationCrudService(
      new TypeORMConsultationRepository(),
      new TypeORMPatientRepository(),
      new TypeORMUsersRepository(),
    );
  }

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = await resolveClinicalTenantId(req);
      const result = await this.service().list(tenantId);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = await resolveClinicalTenantId(req);
      const { id } = IdParamSchema.parse(req.params);
      const result = await this.service().getById(tenantId, id);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = await resolveClinicalTenantId(req);
      const body = CreateConsultationBodySchema.parse(req.body);
      const result = await this.service().create(tenantId, body);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = await resolveClinicalTenantId(req);
      const { id } = IdParamSchema.parse(req.params);
      const body = UpdateConsultationBodySchema.parse(req.body);
      const result = await this.service().update(tenantId, id, body);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };

  remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = await resolveClinicalTenantId(req);
      const { id } = IdParamSchema.parse(req.params);
      const result = await this.service().remove(tenantId, id);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };
}
