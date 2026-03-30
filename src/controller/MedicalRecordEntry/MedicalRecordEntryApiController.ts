import type { AuthRequest } from "@/middleware/auth";
import MedicalRecordEntryCrudService from "@/service/medicalRecordEntry/MedicalRecordEntryCrudService";
import TypeORMConsultationRepository from "@/service/repository/typeorm/typeormConsultations";
import TypeORMMedicalRecordEntryRepository from "@/service/repository/typeorm/typeormMedicalRecordEntries";
import TypeORMMedicalRecordRepository from "@/service/repository/typeorm/typeormMedicalRecords";
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
    );
  }

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const q = ListMedicalRecordEntriesQuerySchema.parse(req.query);
      const result = await this.service().list(
        req.user!.tenantId,
        q.medicalRecordId,
      );
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

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = CreateMedicalRecordEntryBodySchema.parse(req.body);
      const result = await this.service().create(
        req.user!.tenantId,
        body,
        req.user!.id,
      );
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const body = UpdateMedicalRecordEntryBodySchema.parse(req.body);
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
