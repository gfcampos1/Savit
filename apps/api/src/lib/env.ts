import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().default('localhost'),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),

  ENCRYPTION_KEY: z.string().min(32).default('dev-encryption-key-32-chars-long-xx'),

  R2_ACCOUNT_ID: z.string().default(''),
  R2_ACCESS_KEY_ID: z.string().default(''),
  R2_SECRET_ACCESS_KEY: z.string().default(''),
  R2_BUCKET: z.string().default('savit-attachments'),
  R2_PUBLIC_BASE_URL: z.string().default(''),
  R2_REGION: z.string().default('auto'),

  OPENROUTER_API_KEY: z.string().default(''),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_DEFAULT_MODEL: z.string().default('anthropic/claude-sonnet-4-6'),
  OPENROUTER_FALLBACK_MODEL: z.string().default('openai/gpt-5'),
  OPENROUTER_HTTP_REFERER: z.string().default('http://localhost:5173'),
  OPENROUTER_APP_NAME: z.string().default('Savit'),

  AI_DAILY_TOKEN_LIMIT: z.coerce.number().int().positive().default(200_000),
  AI_MONTHLY_TOKEN_LIMIT: z.coerce.number().int().positive().default(2_000_000),

  CRON_SECRET: z.string().default('dev-cron-secret'),

  SENTRY_DSN: z.string().default(''),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env: Env = parsed.data;
