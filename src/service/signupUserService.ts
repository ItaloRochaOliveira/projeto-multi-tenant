import type { User } from "@/db/entities";
import { env } from "@/env";
import type { IHashManager } from "@/interfaces/IHashManager";
import type { ITokeManager } from "@/interfaces/ITokenManager";
import BadRequest from "@/utils/errors/BadRequest";
import type TenantRepository from "./repository/TenantRepository";
import type UsersRepository from "./repository/UsersRepository";
import { toPublicUser } from "./LoginUserService";
import { v4 as uuidv4 } from "uuid";

export interface SignupUserInput {
  tenantSlug: string;
  fullName: string;
  email: string;
  password: string;
  role?: string;
}

export default class SignupUserService {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly users: UsersRepository,
    private readonly tokens: ITokeManager,
    private readonly hash: IHashManager,
  ) {}

  async execute(data: SignupUserInput) {
    const tenant = await this.tenants.getBySlug(data.tenantSlug);
    if (!tenant?.isActive) {
      throw new BadRequest("Instituição inválida ou inativa");
    }

    const existing = await this.users.getByEmail(tenant.id, data.email);
    if (existing) throw new BadRequest("Email já cadastrado nesta instituição");

    const passwordHash = await this.hash.hash(data.password);
    const user = {
      id: uuidv4(),
      tenantId: tenant.id,
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: data.role?.trim() || "staff",
      professionalRegistry: null,
      isActive: true,
    } as User;

    const saved = await this.users.create(user);
    if (!saved) throw new BadRequest("Falha ao criar usuário");

    const token = this.tokens.createToken(
      {
        id: saved.id,
        email: saved.email,
        tenantId: saved.tenantId,
        role: saved.role,
      },
      env.JWT_SECRET,
      "24h",
    );

    return {
      status: "success" as const,
      message: {
        code: 201,
        message: { token, user: toPublicUser(saved) },
      },
    };
  }
}
