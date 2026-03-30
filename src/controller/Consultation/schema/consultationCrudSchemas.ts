import { z } from "zod";

const optionalDate = z.coerce.date().nullable().optional();

export const CreateConsultationBodySchema = z.object({
  patientId: z.string().uuid(),
  practitionerId: z.string().uuid().nullable().optional(),
  scheduledAt: optionalDate,
  startedAt: optionalDate,
  endedAt: optionalDate,
  status: z.string().max(30).optional(),
  chiefComplaint: z.string().max(500).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const UpdateConsultationBodySchema =
  CreateConsultationBodySchema.partial();
