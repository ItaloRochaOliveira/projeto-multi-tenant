import { z } from "zod";

const metadata = z.record(z.string(), z.unknown()).nullable().optional();

export const CreateTenantBodySchema = z.object({
  name: z.string().min(1).max(160),
  legalName: z.string().max(200).nullable().optional(),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "slug inválido"),
  document: z.string().max(20).nullable().optional(),
  metadata,
  isActive: z.boolean().optional(),
});

export const UpdateTenantBodySchema = z.object({
  name: z.string().min(1).max(160).optional(),
  legalName: z.string().max(200).nullable().optional(),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i)
    .optional(),
  document: z.string().max(20).nullable().optional(),
  metadata,
  isActive: z.boolean().optional(),
});
