import 'dotenv/config';
import { z } from 'zod';
import { findProductionMongoUriProblems } from '@motorx/shared-contracts';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().trim().min(1), REDIS_URL: z.string().url(),
  INVENTORY_QUEUE_NAME: z.string().trim().min(1).default('inventory-processing'),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(2),
  // Same limit the backend enforces: draft + active listings per dealer. Rows beyond it are rejected.
  MAX_LISTINGS_PER_DEALER: z.coerce.number().int().positive().default(10_000),
  ETL_BATCH_SIZE: z.coerce.number().int().min(10).max(2_000).default(250),
  S3_ENDPOINT: z.string().url(), S3_REGION: z.string().trim().min(1).default('us-east-1'),
  S3_BUCKET: z.string().trim().min(1), S3_ACCESS_KEY: z.string().trim().min(1), S3_SECRET_KEY: z.string().trim().min(1),
  S3_FORCE_PATH_STYLE: z.string().default('true').transform((value) => value === 'true'),
  S3_PUBLIC_URL: z.string().url().default('http://localhost:3000/api/v1/listing-images'),
  MAX_LISTING_IMAGES: z.coerce.number().int().positive().max(30).default(10),
  MAX_IMAGE_SIZE_MB: z.coerce.number().positive().default(10),
  MAX_IMAGE_ZIP_ENTRIES: z.coerce.number().int().positive().max(100_000).default(2_000),
  MAX_IMAGE_ZIP_EXPANDED_MB: z.coerce.number().positive().max(2_000).default(200),
  ALLOWED_IMAGE_TYPES: z.string().default('image/jpeg,image/png,image/webp').transform((value) => value.split(',').map((type) => type.trim())),
  HF_API_KEY: z.string().trim().optional(),
  HF_EMBEDDING_MODEL: z.string().trim().min(1).default('sentence-transformers/all-MiniLM-L6-v2'),
  EMBEDDING_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(30_000).default(4_000),

  SMTP_HOST: z.string().trim().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().trim().min(1),
  SMTP_PASS: z.string().trim().min(1),
  SMTP_FROM: z.string().trim().min(1).optional(),

  WORKER_HEALTH_PORT: z.coerce.number().int().positive().default(3_100),
  JOB_REAPER_INTERVAL_MS: z.coerce.number().int().positive().default(60_000),
  JOB_MAX_RECLAIM_ATTEMPTS: z.coerce.number().int().positive().default(5),
  // A job still pending after this long is assumed to have lost its queue message and is re-queued.
  PENDING_JOB_REENQUEUE_AFTER_MS: z.coerce.number().int().min(30_000).default(120_000),
  // How long a shutdown may wait for running jobs before handing them back and exiting.
  // Must be below the orchestrator's stop timeout (ECS default: 30 s).
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(25_000),
  // Days after an approve/reject decision before verification documents are deleted.
  DEALER_DOCUMENT_RETENTION_DAYS: z.coerce.number().int().min(1).max(3_650).default(90),
  // How often queued notification emails are sent.
  EMAIL_OUTBOX_INTERVAL_MS: z.coerce.number().int().min(1_000).default(15_000),
  DOCUMENT_RETENTION_INTERVAL_MS: z.coerce.number().int().min(60_000).default(3_600_000),
  // How often to look for stale stock, and the minimum days between two reminders to one dealer.
  STALE_REMINDER_INTERVAL_MS: z.coerce.number().int().min(60_000).default(6 * 3_600_000),
  STALE_REMINDER_REPEAT_DAYS: z.coerce.number().int().min(1).max(90).default(7),
}).superRefine((config, context) => {
  // Refuses to consume jobs in production against a local, dev, test, or unencrypted database.
  if (config.NODE_ENV !== 'production') return;
  for (const message of findProductionMongoUriProblems(config.MONGODB_URI)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['MONGODB_URI'], message });
  }
});

// Parses worker configuration once so invalid deployments fail before consuming jobs.
export const env = envSchema.parse(process.env);
