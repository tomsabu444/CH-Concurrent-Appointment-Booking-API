import { loadEnvFile } from 'node:process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Load .env file
const envPath = path.resolve(__dirname, '../../.env');
if (existsSync(envPath)) {
  try { loadEnvFile(envPath); } catch {}
  try {
    const lines = readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const [k, ...v] = line.trim().split('=');
      if (k && !k.startsWith('#') && !process.env[k]) {
        process.env[k] = v.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch {}
}

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`[Config Error] Missing required environment variable: "${key}"`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  PORT: Number(process.env.PORT) || 3000,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Database Connection (Required)
  DB_SERVER: requireEnv('DB_SERVER'),
  DB_PORT: Number(requireEnv('DB_PORT')),
  DB_USER: requireEnv('DB_USER'),
  DB_PASSWORD: requireEnv('DB_PASSWORD'),
  DB_NAME: requireEnv('DB_NAME'),

  // Database Options (Optional)
  DB_ENCRYPT: process.env.DB_ENCRYPT === 'true',
  DB_TRUST_SERVER_CERTIFICATE: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
} as const;

export type Env = typeof env;
