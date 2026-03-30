import type { AuthRequest } from "@/middleware/auth";
import MedicalRecordCrudService from "@/service/medicalRecord/MedicalRecordCrudService";
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
      const result = await this.service().list(req.user!.tenantId);
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
      const body = CreateMedicalRecordBodySchema.parse(req.body);
      const result = await this.service().create(req.user!.tenantId, body);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const body = UpdateMedicalRecordBodySchema.parse(req.body);
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
