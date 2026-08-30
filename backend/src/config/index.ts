import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (!v) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required env var: ${key}`);
    }
    // In development, allow fallback
    return fallback ?? '';
  }
  return v;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:3001',

  database: {
    url: required('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/school_platform'),
  },

  redis: {
    url: process.env.REDIS_URL ?? '',
  },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret_change_me'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),
  },

  localization: {
    defaultLanguage: process.env.DEFAULT_LANGUAGE ?? 'es',
    supportedLanguages: (process.env.SUPPORTED_LANGUAGES ?? 'es,de,en').split(','),
  },

  pagination: {
    defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT ?? '20', 10),
    maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT ?? '100', 10),
  },

  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY || '',
    apiUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    model: process.env.NVIDIA_MODEL || 'meta/llama-3.2-90b-vision-instruct',
  },

  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',
} as const;
