import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().default(3000),

  MONGODB_URI: z.string().trim().min(1),

  FIREBASE_PROJECT_ID: z.string().trim().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().trim().email(),
  FIREBASE_PRIVATE_KEY: z.string().trim().min(1),
});

export const env = envSchema.parse(process.env);
