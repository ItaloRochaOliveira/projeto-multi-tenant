import { z } from "zod";

export const CreateMedicalRecordBodySchema = z.object({
  patientId: z.string().uuid(),
  bloodType: z.string().max(10).nullable().optional(),
  allergies: z.string().nullable().optional(),
  chronicConditions: z.string().nullable().optional(),
});

export const UpdateMedicalRecordBodySchema = z.object({
  bloodType: z.string().max(10).nullable().optional(),
  allergies: z.string().nullable().optional(),
  chronicConditions: z.string().nullable().optional(),
});
