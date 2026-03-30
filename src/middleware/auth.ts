import { env } from "@/env";
import TypeORMUsersRepository from "@/service/repository/typeorm/typeormUsers";
import BadRequest from "@/utils/errors/BadRequest";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) {
      throw new BadRequest("Token de acesso obrigatório");
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
      tenantId: string;
    };

    const usersRepository = new TypeORMUsersRepository();
    const user = await usersRepository.getById(decoded.id);

    if (
      !user ||
      !user.isActive ||
      user.tenantId !== decoded.tenantId ||
      user.email !== decoded.email
    ) {
      throw new BadRequest("Token inválido ou usuário inativo");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
    next();
  } catch (err) {
    next(err);
  }
};
