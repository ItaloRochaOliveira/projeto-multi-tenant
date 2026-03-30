import type { Patient } from "@/db/entities";
import { ServicePromise } from "@/interfaces/IServiceModel";
import type PatientRepository from "@/service/repository/PatientRepository";
import BadRequest from "@/utils/errors/BadRequest";
import NotFound from "@/utils/errors/NotFound";
import { ok } from "@/utils/apiResponse";
import { v4 as uuidv4 } from "uuid";

/** Entrada da API (Zod): opcionais podem vir ausentes (`undefined`); entidade exige `null` / boolean. */
export type CreatePatientInput = {
  fullName: string;
  birthDate?: Date | null;
  gender?: string | null;
  documentId?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  internalCode?: string | null;
  isActive?: boolean;
};

export type UpdatePatientInput = Partial<
  Pick<
    Patient,
    | "fullName"
    | "birthDate"
    | "gender"
    | "documentId"
    | "phone"
    | "email"
    | "addressLine"
    | "city"
    | "state"
    | "postalCode"
    | "internalCode"
    | "isActive"
  >
>;

export default class PatientCrudService {
  constructor(private readonly repo: PatientRepository) {}

  async list(tenantId: string): ServicePromise<Patient[]> {
    const rows = await this.repo.findByTenant(tenantId, false);
    return ok(200, rows);
  }

  async getById(tenantId: string, id: string): ServicePromise<Patient> {
    const p = await this.repo.findByTenantAndId(tenantId, id);
    if (!p) throw new NotFound("Paciente não encontrado");
    return ok(200, p);
  }

  async create(tenantId: string, data: CreatePatientInput): ServicePromise<Patient> {
    if (data.internalCode) {
      const all = await this.repo.findByTenant(tenantId, true);
      const dup = all.find((x) => x.internalCode === data.internalCode);
      if (dup) throw new BadRequest("Código interno já existe");
    }
    const patient = {
      id: uuidv4(),
      tenantId,
      fullName: data.fullName,
      birthDate: data.birthDate ?? null,
      gender: data.gender ?? null,
      documentId: data.documentId ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      addressLine: data.addressLine ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      postalCode: data.postalCode ?? null,
      internalCode: data.internalCode ?? null,
      isActive: data.isActive ?? true,
    } as Patient;
    const saved = await this.repo.create(patient);
    if (!saved) throw new BadRequest("Falha ao criar paciente");
    return ok(201, saved);
  }

  async update(tenantId: string, id: string, data: UpdatePatientInput): ServicePromise<Patient> {
    const p = await this.repo.findByTenantAndId(tenantId, id);
    if (!p) throw new NotFound("Paciente não encontrado");
    if (data.internalCode && data.internalCode !== p.internalCode) {
      const all = await this.repo.findByTenant(tenantId, true);
      const dup = all.find(
        (x) => x.internalCode === data.internalCode && x.id !== id,
      );
      if (dup) throw new BadRequest("Código interno já existe");
    }
    const result = await this.repo.edit(id, data);
    if (!result.affected) throw new NotFound("Paciente não encontrado");
    const updated = await this.repo.findByTenantAndId(tenantId, id);
    return ok(200, updated!);
  }

  async remove(tenantId: string, id: string): ServicePromise<Patient> {
    const p = await this.repo.findByTenantAndId(tenantId, id);
    if (!p) throw new NotFound("Paciente não encontrado");
    await this.repo.delete(id);
    return ok(200, p);
  }
}
