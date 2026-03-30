import { z } from "zod";

export const ListMedicalRecordEntriesQuerySchema = z.object({
  medicalRecordId: z.string().uuid().optional(),
});

export const CreateMedicalRecordEntryBodySchema = z.object({
  medicalRecordId: z.string().uuid(),
  consultationId: z.string().uuid().nullable().optional(),
  entryType: z.string().max(40).optional(),
  title: z.string().max(200).nullable().optional(),
  content: z.string().min(1),
  authorId: z.string().uuid().optional(),
});

export const UpdateMedicalRecordEntryBodySchema = z.object({
  consultationId: z.string().uuid().nullable().optional(),
  entryType: z.string().max(40).optional(),
  title: z.string().max(200).nullable().optional(),
  content: z.string().min(1).optional(),
  recordedAt: z.coerce.date().optional(),
});
