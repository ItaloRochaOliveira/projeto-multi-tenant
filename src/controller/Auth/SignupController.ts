import SignupUserService from "@/service/signupUserService";
import TypeORMTenantsRepository from "@/service/repository/typeorm/typeormTenants";
import TypeORMUsersRepository from "@/service/repository/typeorm/typeormUsers";
import { HashManager } from "@/utils/HashManager";
import { TokenManager } from "@/utils/TokenManager";
import type { NextFunction, Request, Response } from "express";
import { SignupSchema } from "./schema/SignupSchema";

export default class SignupController {
  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = SignupSchema.parse(req.body);
      const service = new SignupUserService(
        new TypeORMTenantsRepository(),
        new TypeORMUsersRepository(),
        new TokenManager(),
        new HashManager(),
      );
      const result = await service.execute(body);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  }
}
