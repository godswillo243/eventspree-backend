import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string(),
  DATABASE_URL: z.string(),
  RESEND_API_KEY: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRES: z
    .string()
    .refine((v) => /^\d+(ms|s|m|h|d)?$/.test(v), "Invalid duration"),
  JWT_REFRESH_EXPIRES: z
    .string()
    .refine((v) => /^\d+(ms|s|m|h|d)?$/.test(v), "Invalid duration"),
  PLATFORM_COMMISSION_RATE: z.coerce.number().positive().default(0.05),
  NODE_ENV: z
    .enum(["development", "production", "testing"])
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid env: ${parsed.error.message}`);
}

export const env = parsed.data;
