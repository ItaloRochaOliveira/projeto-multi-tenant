import type { AuthRequest } from "@/middleware/auth";
import ConsultationCrudService from "@/service/consultation/ConsultationCrudService";
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
      const body = CreateConsultationBodySchema.parse(req.body);
      const result = await this.service().create(req.user!.tenantId, body);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const body = UpdateConsultationBodySchema.parse(req.body);
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
