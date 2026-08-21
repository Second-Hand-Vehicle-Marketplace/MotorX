import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().trim().min(1), REDIS_URL: z.string().url(),
  INVENTORY_QUEUE_NAME: z.string().trim().min(1).default('inventory-processing'),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(2),
  ETL_BATCH_SIZE: z.coerce.number().int().min(10).max(2_000).default(250),
  S3_ENDPOINT: z.string().url(), S3_REGION: z.string().trim().min(1).default('us-east-1'),
  S3_BUCKET: z.string().trim().min(1), S3_ACCESS_KEY: z.string().trim().min(1), S3_SECRET_KEY: z.string().trim().min(1),
  S3_FORCE_PATH_STYLE: z.string().default('true').transform((value) => value === 'true'),
  S3_PUBLIC_URL: z.string().url().default('http://localhost:3000/api/v1/listing-images'),
  MAX_LISTING_IMAGES: z.coerce.number().int().positive().max(30).default(10),
  MAX_IMAGE_SIZE_MB: z.coerce.number().positive().default(10),
  ALLOWED_IMAGE_TYPES: z.string().default('image/jpeg,image/png,image/webp').transform((value) => value.split(',').map((type) => type.trim())),

  SMTP_HOST: z.string().trim().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().trim().min(1),
  SMTP_PASS: z.string().trim().min(1),
  SMTP_FROM: z.string().trim().min(1).optional(),
});

// Parses worker configuration once so invalid deployments fail before consuming jobs.
export const env = envSchema.parse(process.env);
