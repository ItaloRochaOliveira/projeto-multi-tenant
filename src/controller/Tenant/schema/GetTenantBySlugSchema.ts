import { z } from "zod";

export const GetTenantBySlugSchema = z.object({
  slug: z.string().min(1, "slug inválido"),
});

export type GetTenantBySlugParams = z.infer<typeof GetTenantBySlugSchema>;
