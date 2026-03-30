import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  MYSQL_HOST: z.string(),
  MYSQL_PORT: z.coerce.number().default(3306),
  MYSQL_USER: z.string(),
  MYSQL_PASSWORD: z.string(),
  MYSQL_DATABASE: z.string(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET deve ter pelo menos 16 caracteres"),
  ENV: z.string().default("dev"),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("❌ Variáveis de ambiente inválidas", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
