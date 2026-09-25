import 'dotenv/config';
import { z } from 'zod';
import { findProductionMongoUriProblems } from '@motorx/shared-contracts';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().default(3000),
  // How long shutdown waits for in-flight requests. Must be below the orchestrator's stop
  // timeout (ECS default: 30 s), after which the process is killed outright.
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(20_000),

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
  MAX_IMAGE_ZIP_SIZE_MB: z.coerce.number().positive().default(50),
  HF_API_KEY: z.string().trim().optional(),
  HF_EMBEDDING_MODEL: z.string().trim().min(1).default('sentence-transformers/all-MiniLM-L6-v2'),
  EMBEDDING_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(30_000).default(4_000),
  ATLAS_VECTOR_INDEX: z.string().trim().min(1).default('listing_embedding_index'),

  SMTP_HOST: z.string().trim().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().trim().min(1),
  SMTP_PASS: z.string().trim().min(1),
  SMTP_FROM: z.string().trim().min(1).optional(),
}).superRefine((config, context) => {
  // Refuses to start production against a local, dev, test, or unencrypted database.
  if (config.NODE_ENV !== 'production') return;
  for (const message of findProductionMongoUriProblems(config.MONGODB_URI)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['MONGODB_URI'], message });
  }
});

export const env = envSchema.parse(process.env);
