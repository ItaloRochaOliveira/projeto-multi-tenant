import type { AuthRequest } from "@/middleware/auth";
import MedicalRecordCrudService from "@/service/medicalRecord/MedicalRecordCrudService";
import { resolveClinicalTenantId } from "@/utils/clinicalTenant";
import TypeORMMedicalRecordRepository from "@/service/repository/typeorm/typeormMedicalRecords";
import TypeORMPatientRepository from "@/service/repository/typeorm/typeormPatients";
import type { NextFunction, Response } from "express";
import { IdParamSchema } from "../shared/idParamSchema";
import {
  CreateMedicalRecordBodySchema,
  UpdateMedicalRecordBodySchema,
} from "./schema/medicalRecordCrudSchemas";

export default class MedicalRecordApiController {
  private service() {
    return new MedicalRecordCrudService(
      new TypeORMMedicalRecordRepository(),
      new TypeORMPatientRepository(),
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
      const body = CreateMedicalRecordBodySchema.parse(req.body);
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
      const body = UpdateMedicalRecordBodySchema.parse(req.body);
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
