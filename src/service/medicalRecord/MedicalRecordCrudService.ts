import type { MedicalRecord } from "@/db/entities";
import type { ServicePromise } from "@/interfaces/IServiceModel";
import type MedicalRecordRepository from "@/service/repository/MedicalRecordRepository";
import type PatientRepository from "@/service/repository/PatientRepository";
import BadRequest from "@/utils/errors/BadRequest";
import NotFound from "@/utils/errors/NotFound";
import { ok } from "@/utils/apiResponse";
import { v4 as uuidv4 } from "uuid";

/** Entrada da API (Zod): opcionais podem vir ausentes (`undefined`). */
export type CreateMedicalRecordInput = {
  patientId: string;
  bloodType?: string | null | undefined;
  allergies?: string | null | undefined;
  chronicConditions?: string | null | undefined;
};

export type UpdateMedicalRecordInput = {
  bloodType?: string | null | undefined;
  allergies?: string | null | undefined;
  chronicConditions?: string | null | undefined;
};

export default class MedicalRecordCrudService {
  constructor(
    private readonly repo: MedicalRecordRepository,
    private readonly patients: PatientRepository,
  ) {}

  async list(tenantId: string): ServicePromise<MedicalRecord[]> {
    const rows = await this.repo.findByTenant(tenantId);
    return ok(200, rows);
  }

  async getById(tenantId: string, id: string): ServicePromise<MedicalRecord> {
    const r = await this.repo.findByTenantAndId(tenantId, id);
    if (!r) throw new NotFound("Prontuário não encontrado");
    return ok(200, r);
  }

  async create(
    tenantId: string,
    data: CreateMedicalRecordInput,
  ): ServicePromise<MedicalRecord> {
    const patient = await this.patients.findByTenantAndId(tenantId, data.patientId);
    if (!patient) throw new BadRequest("Paciente inválido para este tenant");
    const existing = await this.repo.findByTenantAndPatientId(
      tenantId,
      data.patientId,
    );
    if (existing) {
      throw new BadRequest("Já existe prontuário para este paciente");
    }
    const row = {
      id: uuidv4(),
      tenantId,
      patientId: data.patientId,
      bloodType: data.bloodType ?? null,
      allergies: data.allergies ?? null,
      chronicConditions: data.chronicConditions ?? null,
    } as MedicalRecord;
    const saved = await this.repo.create(row);
    if (!saved) throw new BadRequest("Falha ao criar prontuário");
    return ok(201, saved);
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateMedicalRecordInput,
  ): ServicePromise<MedicalRecord> {
    const r = await this.repo.findByTenantAndId(tenantId, id);
    if (!r) throw new NotFound("Prontuário não encontrado");
    const result = await this.repo.edit(id, data);
    if (!result.affected) throw new NotFound("Prontuário não encontrado");
    const updated = await this.repo.findByTenantAndId(tenantId, id);
    return ok(200, updated!);
  }

  async remove(
    tenantId: string,
    id: string,
  ): ServicePromise<{ id: string; deleted: boolean }> {
    const r = await this.repo.findByTenantAndId(tenantId, id);
    if (!r) throw new NotFound("Prontuário não encontrado");
    await this.repo.delete(id);
    return ok(200, { id, deleted: true });
  }
}
