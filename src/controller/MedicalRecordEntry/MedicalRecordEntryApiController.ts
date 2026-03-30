import type { AuthRequest } from "@/middleware/auth";
import MedicalRecordEntryCrudService from "@/service/medicalRecordEntry/MedicalRecordEntryCrudService";
import { resolveClinicalTenantId } from "@/utils/clinicalTenant";
import TypeORMConsultationRepository from "@/service/repository/typeorm/typeormConsultations";
import TypeORMMedicalRecordEntryRepository from "@/service/repository/typeorm/typeormMedicalRecordEntries";
import TypeORMMedicalRecordRepository from "@/service/repository/typeorm/typeormMedicalRecords";
import TypeORMTenantsRepository from "@/service/repository/typeorm/typeormTenants";
import TypeORMUsersRepository from "@/service/repository/typeorm/typeormUsers";
import type { NextFunction, Response } from "express";
import { IdParamSchema } from "../shared/idParamSchema";
import {
  CreateMedicalRecordEntryBodySchema,
  ListMedicalRecordEntriesQuerySchema,
  UpdateMedicalRecordEntryBodySchema,
} from "./schema/medicalRecordEntryCrudSchemas";

export default class MedicalRecordEntryApiController {
  private service() {
    return new MedicalRecordEntryCrudService(
      new TypeORMMedicalRecordEntryRepository(),
      new TypeORMMedicalRecordRepository(),
      new TypeORMConsultationRepository(),
      new TypeORMUsersRepository(),
      new TypeORMTenantsRepository(),
    );
  }

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = await resolveClinicalTenantId(req);
      const q = ListMedicalRecordEntriesQuerySchema.parse(req.query);
      const result = await this.service().list(tenantId, q.medicalRecordId);
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
      const body = CreateMedicalRecordEntryBodySchema.parse(req.body);
      const result = await this.service().create(tenantId, body, req.user!.id);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = await resolveClinicalTenantId(req);
      const { id } = IdParamSchema.parse(req.params);
      const body = UpdateMedicalRecordEntryBodySchema.parse(req.body);
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
