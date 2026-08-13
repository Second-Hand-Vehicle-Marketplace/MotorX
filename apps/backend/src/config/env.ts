import 'dotenv/config';

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3000),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/motorx',
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
  SMTP_HOST: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? 'motorx-aece4',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ?? '',
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
  OWNER_ADMIN_EMAIL: process.env.OWNER_ADMIN_EMAIL ?? 'ajanmahendra918@gmail.com',
  API_URL: process.env.VITE_API_URL ?? process.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1',
} as const;
