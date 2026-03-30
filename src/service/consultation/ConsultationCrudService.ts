import type { Consultation } from "@/db/entities";
import { ServicePromise } from "@/interfaces/IServiceModel";
import type ConsultationRepository from "@/service/repository/ConsultationRepository";
import type PatientRepository from "@/service/repository/PatientRepository";
import type UsersRepository from "@/service/repository/UsersRepository";
import BadRequest from "@/utils/errors/BadRequest";
import NotFound from "@/utils/errors/NotFound";
import { ok } from "@/utils/apiResponse";
import { v4 as uuidv4 } from "uuid";

/** Entrada da API (Zod): opcionais podem vir ausentes (`undefined`). */
export type CreateConsultationInput = {
  patientId: string;
  practitionerId?: string | null | undefined;
  scheduledAt?: Date | null | undefined;
  startedAt?: Date | null | undefined;
  endedAt?: Date | null | undefined;
  status?: string | undefined;
  chiefComplaint?: string | null | undefined;
  notes?: string | null | undefined;
};

export type UpdateConsultationInput = Partial<CreateConsultationInput>;

export default class ConsultationCrudService {
  constructor(
    private readonly repo: ConsultationRepository,
    private readonly patients: PatientRepository,
    private readonly users: UsersRepository,
  ) {}

  private async assertPatient(tenantId: string, patientId: string) {
    const p = await this.patients.findByTenantAndId(tenantId, patientId);
    if (!p) throw new BadRequest("Paciente inválido para este tenant");
  }

  private async assertPractitioner(
    tenantId: string,
    practitionerId: string | null | undefined,
  ) {
    if (!practitionerId) return;
    const u = await this.users.getById(practitionerId);
    if (!u || u.tenantId !== tenantId) {
      throw new BadRequest("Profissional inválido para este tenant");
    }
  }

  async list(tenantId: string): ServicePromise<Consultation[]> {
    const rows = await this.repo.findByTenant(tenantId);
    return ok(200, rows);
  }

  async getById(tenantId: string, id: string): ServicePromise<Consultation> {
    const c = await this.repo.findByTenantAndId(tenantId, id);
    if (!c) throw new NotFound("Consulta não encontrada");
    return ok(200, c);
  }

  async create(tenantId: string, data: CreateConsultationInput): ServicePromise<Consultation> {
    await this.assertPatient(tenantId, data.patientId);
    await this.assertPractitioner(tenantId, data.practitionerId);
    const row = {
      id: uuidv4(),
      tenantId,
      patientId: data.patientId,
      practitionerId: data.practitionerId ?? null,
      scheduledAt: data.scheduledAt ?? null,
      startedAt: data.startedAt ?? null,
      endedAt: data.endedAt ?? null,
      status: data.status ?? "scheduled",
      chiefComplaint: data.chiefComplaint ?? null,
      notes: data.notes ?? null,
    } as Consultation;
    const saved = await this.repo.create(row);
    if (!saved) throw new BadRequest("Falha ao criar consulta");
    return ok(201, saved);
  }

  async update(tenantId: string, id: string, data: UpdateConsultationInput): ServicePromise<Consultation> {
    const c = await this.repo.findByTenantAndId(tenantId, id);
    if (!c) throw new NotFound("Consulta não encontrada");
    if (data.patientId) {
      await this.assertPatient(tenantId, data.patientId);
    }
    if (data.practitionerId !== undefined) {
      await this.assertPractitioner(tenantId, data.practitionerId);
    }
    const result = await this.repo.edit(id, data);
    if (!result.affected) throw new NotFound("Consulta não encontrada");
    const updated = await this.repo.findByTenantAndId(tenantId, id);
    return ok(200, updated!);
  }

  async remove(tenantId: string, id: string): ServicePromise<Consultation> {
    const c = await this.repo.findByTenantAndId(tenantId, id);
    if (!c) throw new NotFound("Consulta não encontrada");
    await this.repo.delete(id);
    return ok(200, c);
  }
}
