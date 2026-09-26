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
  // Number of proxies in front of the API (1 behind an AWS load balancer), so rate limits see the
  // real client IP from X-Forwarded-For instead of the proxy's. 0 locally.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),

  // Abuse controls. Per-minute budgets are per client IP (per user where noted), shared across
  // all backend instances through Redis; a Redis outage disables them rather than the API.
  RATE_LIMIT_API_PER_MINUTE: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_SEARCH_PER_MINUTE: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_UPLOADS_PER_10_MINUTES: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_LISTING_PHOTOS_PER_10_MINUTES: z.coerce.number().int().positive().default(150),
  RATE_LIMIT_DEALER_APPLICATIONS_PER_HOUR: z.coerce.number().int().positive().default(5),
  // Daily upload quotas per dealer.
  QUOTA_CSV_UPLOADS_PER_DAY: z.coerce.number().int().positive().default(50),
  QUOTA_PHOTO_ZIPS_PER_DAY: z.coerce.number().int().positive().default(200),
  // Draft + active listings one dealer may hold (manual listings and CSV imports). Must stay
  // above the SRS bulk-import size (5,000 records in one upload).
  MAX_LISTINGS_PER_DEALER: z.coerce.number().int().positive().default(10_000),
  // Uploads are held in memory while being checked and stored, so each backend instance accepts
  // at most this many at once (e.g. 4 x 50 MB zips = 200 MB) and asks the rest to retry shortly.
  MAX_CONCURRENT_UPLOADS: z.coerce.number().int().positive().default(4),

  // How long a verified Firebase ID token is trusted before it is checked with Firebase again
  // (including whether it was revoked). Tokens are also never trusted past their own expiry.
  AUTH_TOKEN_CACHE_TTL_MS: z.coerce.number().int().min(0).max(600_000).default(120_000),

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

  // Email is sent only by the worker's outbox; the backend no longer needs SMTP credentials.
  // Kept optional so existing .env files still load.
  SMTP_HOST: z.string().trim().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().trim().min(1).optional(),
  SMTP_PASS: z.string().trim().min(1).optional(),
  SMTP_FROM: z.string().trim().min(1).optional(),
}).superRefine((config, context) => {
  // Refuses to start production against a local, dev, test, or unencrypted database.
  if (config.NODE_ENV !== 'production') return;
  for (const message of findProductionMongoUriProblems(config.MONGODB_URI)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['MONGODB_URI'], message });
  }
});

export const env = envSchema.parse(process.env);
