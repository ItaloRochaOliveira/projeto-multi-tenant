import type { AuthRequest } from "@/middleware/auth";
import PatientCrudService from "@/service/patient/PatientCrudService";
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
      const body = CreatePatientBodySchema.parse(req.body);
      const normalized = {
        ...body,
        email: body.email === "" ? null : body.email,
      };
      const result = await this.service().create(req.user!.tenantId, normalized);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const body = UpdatePatientBodySchema.parse(req.body);
      const normalized = {
        ...body,
        ...(body.email !== undefined
          ? { email: body.email === "" ? null : body.email }
          : {}),
      };
      const result = await this.service().update(
        req.user!.tenantId,
        id,
        normalized,
      );
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
