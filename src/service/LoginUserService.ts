import type { User } from "@/db/entities";
import { env } from "@/env";
import type { IHashManager } from "@/interfaces/IHashManager";
import type { ITokeManager } from "@/interfaces/ITokenManager";
import BadRequest from "@/utils/errors/BadRequest";
import NotFound from "@/utils/errors/NotFound";
import type TenantRepository from "./repository/TenantRepository";
import type UsersRepository from "./repository/UsersRepository";

export interface LoginUserInput {
  tenantSlug: string;
  email: string;
  password: string;
}

export function toPublicUser(user: User) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export default class LoginUserService {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly users: UsersRepository,
    private readonly hash: IHashManager,
    private readonly tokens: ITokeManager,
  ) {}

  async execute(data: LoginUserInput) {
    const tenant = await this.tenants.getBySlug(data.tenantSlug);
    if (!tenant?.isActive) throw new NotFound("Instituição não encontrada");

    const user = await this.users.getByEmail(tenant.id, data.email);
    if (!user?.isActive) throw new NotFound("Usuário não encontrado");

    const okPass = await this.hash.compare(data.password, user.passwordHash);
    if (!okPass) throw new BadRequest("Senha inválida");

    const token = this.tokens.createToken(
      {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      },
      env.JWT_SECRET,
      "24h",
    );

    return {
      status: "success" as const,
      message: {
        code: 200,
        message: { token, user: toPublicUser(user) },
      },
    };
  }
}
