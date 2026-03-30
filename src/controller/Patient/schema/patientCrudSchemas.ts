import { z } from "zod";

export const CreatePatientBodySchema = z.object({
  fullName: z.string().min(1).max(200),
  birthDate: z.coerce.date().nullable().optional(),
  gender: z.string().max(20).nullable().optional(),
  documentId: z.string().max(32).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  addressLine: z.string().max(255).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  state: z.string().max(60).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  internalCode: z.string().max(64).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const UpdatePatientBodySchema = CreatePatientBodySchema.partial();
