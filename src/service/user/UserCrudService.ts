import type { User } from "@/db/entities";
import type UsersRepository from "@/service/repository/UsersRepository";
import type { IHashManager } from "@/interfaces/IHashManager";
import BadRequest from "@/utils/errors/BadRequest";
import Forbidden from "@/utils/errors/Forbidden";
import NotFound from "@/utils/errors/NotFound";
import { ok } from "@/utils/apiResponse";
import { v4 as uuidv4 } from "uuid";

export function toPublicUser(user: User) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export type CreateUserInput = {
  email: string;
  password: string;
  fullName: string;
  role?: string;
  professionalRegistry?: string | null;
};

export type UpdateUserInput = Partial<{
  email: string;
  password: string;
  fullName: string;
  role: string;
  professionalRegistry: string | null;
  isActive: boolean;
}>;

export default class UserCrudService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly hash: IHashManager,
  ) {}

  async list(tenantId: string) {
    const rows = await this.repo.findByTenant(tenantId);
    return ok(200, rows.map(toPublicUser));
  }

  async getById(tenantId: string, id: string) {
    const u = await this.repo.getById(id);
    if (!u || u.tenantId !== tenantId) {
      throw new NotFound("Usuário não encontrado");
    }
    return ok(200, toPublicUser(u));
  }

  async create(tenantId: string, data: CreateUserInput) {
    const exists = await this.repo.getByEmail(tenantId, data.email);
    if (exists) {
      throw new BadRequest("Email já cadastrado nesta instituição");
    }
    const passwordHash = await this.hash.hash(data.password);
    const user = {
      id: uuidv4(),
      tenantId,
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: data.role?.trim() || "staff",
      professionalRegistry: data.professionalRegistry ?? null,
      isActive: true,
    } as User;
    const saved = await this.repo.create(user);
    if (!saved) throw new BadRequest("Falha ao criar usuário");
    return ok(201, toPublicUser(saved));
  }

  async update(tenantId: string, id: string, data: UpdateUserInput) {
    const u = await this.repo.getById(id);
    if (!u || u.tenantId !== tenantId) {
      throw new NotFound("Usuário não encontrado");
    }
    if (data.email && data.email !== u.email) {
      const taken = await this.repo.getByEmail(tenantId, data.email);
      if (taken) throw new BadRequest("Email já em uso");
    }
    const payload: Partial<User> = {};
    if (data.email !== undefined) payload.email = data.email;
    if (data.fullName !== undefined) payload.fullName = data.fullName;
    if (data.role !== undefined) payload.role = data.role;
    if (data.professionalRegistry !== undefined) {
      payload.professionalRegistry = data.professionalRegistry;
    }
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.password) {
      payload.passwordHash = await this.hash.hash(data.password);
    }
    if (Object.keys(payload).length === 0) {
      throw new BadRequest("Nada para atualizar");
    }
    const result = await this.repo.edit(id, payload);
    if (!result.affected) throw new NotFound("Usuário não encontrado");
    const updated = await this.repo.getById(id);
    return ok(200, toPublicUser(updated!));
  }

  async remove(tenantId: string, id: string, requesterId: string) {
    if (id === requesterId) {
      throw new Forbidden("Não é possível desativar o próprio usuário por aqui");
    }
    const u = await this.repo.getById(id);
    if (!u || u.tenantId !== tenantId) {
      throw new NotFound("Usuário não encontrado");
    }
    await this.repo.edit(id, { isActive: false });
    const updated = await this.repo.getById(id);
    return ok(200, toPublicUser(updated!));
  }
}
