import type { AuthRequest } from "@/middleware/auth";
import UserCrudService from "@/service/user/UserCrudService";
import TypeORMUsersRepository from "@/service/repository/typeorm/typeormUsers";
import { HashManager } from "@/utils/HashManager";
import type { NextFunction, Response } from "express";
import { IdParamSchema } from "../shared/idParamSchema";
import {
  CreateUserBodySchema,
  UpdateUserBodySchema,
} from "./schema/userCrudSchemas";

export default class UserApiController {
  private service() {
    return new UserCrudService(new TypeORMUsersRepository(), new HashManager());
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
      const body = CreateUserBodySchema.parse(req.body);
      const result = await this.service().create(req.user!.tenantId, body);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const body = UpdateUserBodySchema.parse(req.body);
      const result = await this.service().update(req.user!.tenantId, id, body);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };

  remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const result = await this.service().remove(
        req.user!.tenantId,
        id,
        req.user!.id,
      );
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };
}
