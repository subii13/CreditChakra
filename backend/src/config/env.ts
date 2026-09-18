import { z } from "zod";

// Fail fast and loudly if required server-only configuration is
// missing, rather than booting into a half-configured, insecure state.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CORS_ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
  ENCRYPTION_KEY: z.string().min(1, "ENCRYPTION_KEY is required (openssl rand -base64 32)"),
  SESSION_SECRET: z.string().min(1),
  LLM_API_KEY: z.string().optional().default(""),
  TURNSTILE_SECRET_KEY: z.string().optional().default(""),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration. Check backend/.env against backend/.env.example.");
  }
  return parsed.data;
}

export const env = loadEnv();

export const corsAllowedOrigins = env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
export const isProduction = env.NODE_ENV === "production";
