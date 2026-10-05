import { z } from "zod";

try {
  process.loadEnvFile();
} catch {
  // O arquivo .env é opcional: sem ele, valem as variáveis do sistema e os padrões abaixo.
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_PATH: z.string().min(1).default("data/database.sqlite"),
  /** Origens permitidas para CORS, separadas por vírgula. Vazio = CORS desabilitado. */
  CORS_ORIGIN: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean)
        : [],
    ),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  /** Máximo de requisições por IP, por minuto, na API. */
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:\n" + z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
