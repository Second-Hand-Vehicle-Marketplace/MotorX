import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().default(3000),

  MONGODB_URI: z.string().trim().min(1),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  INVENTORY_QUEUE_NAME: z.string().trim().min(1).default('inventory-processing'),

  FIREBASE_PROJECT_ID: z.string().trim().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().trim().email(),
  FIREBASE_PRIVATE_KEY: z.string().trim().min(1),

  S3_ENDPOINT: z.string().url(),
  S3_PUBLIC_URL: z.string().url().default('http://localhost:3000/api/v1/listing-images'),
  S3_REGION: z.string().trim().min(1).default('us-east-1'),
  S3_BUCKET: z.string().trim().min(1),
  S3_ACCESS_KEY: z.string().trim().min(1),
  S3_SECRET_KEY: z.string().trim().min(1),
  S3_FORCE_PATH_STYLE: z.string().default('true').transform((value) => value === 'true'),
  MAX_IMAGE_SIZE_MB: z.coerce.number().positive().default(10),
  MAX_LISTING_IMAGES: z.coerce.number().int().positive().max(30).default(10),
  ALLOWED_IMAGE_TYPES: z.string().default('image/jpeg,image/png,image/webp').transform((value) => value.split(',').map((type) => type.trim())),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(20),
  ALLOWED_UPLOAD_TYPES: z.string().default('text/csv,application/csv,application/vnd.ms-excel').transform((value) => value.split(',').map((type) => type.trim())),
});

export const env = envSchema.parse(process.env);
