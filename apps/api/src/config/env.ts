import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from apps/api directory or repository root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(65535)),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required for database connectivity'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long for production security'),
  JWT_EXPIRES_IN: z
    .string()
    .default('8h'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173,http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Format errors safely without printing any potential secret values
  const errorDetails = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  console.error('CRITICAL: Environment validation failed:');
  console.error(errorDetails);
  process.exit(1);
}

export const env = parsed.data;
