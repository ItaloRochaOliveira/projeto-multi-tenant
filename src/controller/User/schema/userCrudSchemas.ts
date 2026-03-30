import { z } from "zod";

export const CreateUserBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2).max(200),
  role: z.string().min(1).max(50).optional(),
  professionalRegistry: z.string().max(50).nullable().optional(),
});

export const UpdateUserBodySchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  fullName: z.string().min(2).max(200).optional(),
  role: z.string().min(1).max(50).optional(),
  professionalRegistry: z.string().max(50).nullable().optional(),
  isActive: z.boolean().optional(),
});
