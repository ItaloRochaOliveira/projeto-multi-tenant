import { z } from "zod";

export const SignupSchema = z.object({
  tenantSlug: z.string().min(1),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().min(1).optional(),
});
