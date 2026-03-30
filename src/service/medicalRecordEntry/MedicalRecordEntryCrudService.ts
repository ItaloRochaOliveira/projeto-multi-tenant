import type { MedicalRecordEntry } from "@/db/entities";
import type { ServicePromise } from "@/interfaces/IServiceModel";
import type ConsultationRepository from "@/service/repository/ConsultationRepository";
import type MedicalRecordEntryRepository from "@/service/repository/MedicalRecordEntryRepository";
import type MedicalRecordRepository from "@/service/repository/MedicalRecordRepository";
import type UsersRepository from "@/service/repository/UsersRepository";
import { ok } from "@/utils/apiResponse";
import BadRequest from "@/utils/errors/BadRequest";
import NotFound from "@/utils/errors/NotFound";
import { v4 as uuidv4 } from "uuid";

/** Entrada da API (Zod): opcionais podem vir ausentes (`undefined`). */
export type CreateMedicalRecordEntryInput = {
  medicalRecordId: string;
  consultationId?: string | null | undefined;
  entryType?: string | undefined;
  title?: string | null | undefined;
  content: string;
  authorId?: string | undefined;
};

export type UpdateMedicalRecordEntryInput = {
  consultationId?: string | null | undefined;
  entryType?: string | undefined;
  title?: string | null | undefined;
  content?: string | undefined;
  recordedAt?: Date | undefined;
};

export default class MedicalRecordEntryCrudService {
  constructor(
    private readonly repo: MedicalRecordEntryRepository,
    private readonly records: MedicalRecordRepository,
    private readonly consultations: ConsultationRepository,
    private readonly users: UsersRepository,
  ) {}

  private async assertRecord(tenantId: string, medicalRecordId: string) {
    const r = await this.records.findByTenantAndId(tenantId, medicalRecordId);
    if (!r) throw new BadRequest("Prontuário inválido para este tenant");
  }

  private async assertConsultation(
    tenantId: string,
    consultationId: string | null | undefined,
  ) {
    if (!consultationId) return;
    const c = await this.consultations.findByTenantAndId(tenantId, consultationId);
    if (!c) throw new BadRequest("Consulta inválida para este tenant");
  }

  private async assertAuthor(tenantId: string, authorId: string) {
    const u = await this.users.getById(authorId);
    if (!u || u.tenantId !== tenantId) {
      throw new BadRequest("Autor inválido para este tenant");
    }
  }

  async list(
    tenantId: string,
    medicalRecordId?: string,
  ): ServicePromise<MedicalRecordEntry[]> {
    const rows = medicalRecordId
      ? await this.repo.findByTenantAndRecordId(tenantId, medicalRecordId)
      : await this.repo.findByTenant(tenantId);
    return ok(200, rows);
  }

  async getById(tenantId: string, id: string): ServicePromise<MedicalRecordEntry> {
    const e = await this.repo.findByTenantAndId(tenantId, id);
    if (!e) throw new NotFound("Registro não encontrado");
    return ok(200, e);
  }

  async create(
    tenantId: string,
    data: CreateMedicalRecordEntryInput,
    defaultAuthorId: string,
  ): ServicePromise<MedicalRecordEntry> {
    await this.assertRecord(tenantId, data.medicalRecordId);
    await this.assertConsultation(tenantId, data.consultationId);
    const authorId = data.authorId ?? defaultAuthorId;
    await this.assertAuthor(tenantId, authorId);
    const row = {
      id: uuidv4(),
      tenantId,
      medicalRecordId: data.medicalRecordId,
      consultationId: data.consultationId ?? null,
      authorId,
      entryType: data.entryType ?? "progress",
      title: data.title ?? null,
      content: data.content,
    } as MedicalRecordEntry;
    const saved = await this.repo.create(row);
    if (!saved) throw new BadRequest("Falha ao criar registro");
    return ok(201, saved);
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateMedicalRecordEntryInput,
  ): ServicePromise<MedicalRecordEntry> {
    const e = await this.repo.findByTenantAndId(tenantId, id);
    if (!e) throw new NotFound("Registro não encontrado");
    if (data.consultationId !== undefined) {
      await this.assertConsultation(tenantId, data.consultationId);
    }
    const result = await this.repo.edit(id, data);
    if (!result.affected) throw new NotFound("Registro não encontrado");
    const updated = await this.repo.findByTenantAndId(tenantId, id);
    return ok(200, updated!);
  }

  async remove(
    tenantId: string,
    id: string,
  ): ServicePromise<{ id: string; deleted: boolean }> {
    const e = await this.repo.findByTenantAndId(tenantId, id);
    if (!e) throw new NotFound("Registro não encontrado");
    await this.repo.delete(id);
    return ok(200, { id, deleted: true });
  }
}
