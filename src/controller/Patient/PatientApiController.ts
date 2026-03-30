import type { AuthRequest } from "@/middleware/auth";
import PatientCrudService from "@/service/patient/PatientCrudService";
import { resolveClinicalTenantId } from "@/utils/clinicalTenant";
import TypeORMPatientRepository from "@/service/repository/typeorm/typeormPatients";
import type { NextFunction, Response } from "express";
import { IdParamSchema } from "../shared/idParamSchema";
import {
  CreatePatientBodySchema,
  UpdatePatientBodySchema,
} from "./schema/patientCrudSchemas";

export default class PatientApiController {
  private service() {
    return new PatientCrudService(new TypeORMPatientRepository());
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
      const body = CreatePatientBodySchema.parse(req.body);
      const normalized = {
        ...body,
        email: body.email === "" ? null : body.email,
      };
      const result = await this.service().create(tenantId, normalized);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = await resolveClinicalTenantId(req);
      const { id } = IdParamSchema.parse(req.params);
      const body = UpdatePatientBodySchema.parse(req.body);
      const normalized = {
        ...body,
        ...(body.email !== undefined
          ? { email: body.email === "" ? null : body.email }
          : {}),
      };
      const result = await this.service().update(tenantId, id, normalized);
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
