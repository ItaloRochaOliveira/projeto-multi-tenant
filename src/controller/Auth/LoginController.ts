import LoginUserService from "@/service/LoginUserService";
import TypeORMTenantsRepository from "@/service/repository/typeorm/typeormTenants";
import TypeORMUsersRepository from "@/service/repository/typeorm/typeormUsers";
import { HashManager } from "@/utils/HashManager";
import { TokenManager } from "@/utils/TokenManager";
import type { NextFunction, Request, Response } from "express";
import { LoginSchema } from "./schema/LoginSchema";

export default class LoginController {
  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = LoginSchema.parse(req.body);
      const service = new LoginUserService(
        new TypeORMTenantsRepository(),
        new TypeORMUsersRepository(),
        new HashManager(),
        new TokenManager(),
      );
      const result = await service.execute(body);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }
}
