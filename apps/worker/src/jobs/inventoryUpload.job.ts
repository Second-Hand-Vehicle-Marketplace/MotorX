import type { Job } from 'bullmq';
import { z } from 'zod';
import { extractInventoryUpload } from '../services/uploadJob.service.js';

const payloadSchema = z.object({ uploadJobId: z.string().regex(/^[a-f\d]{24}$/i) });

// Validates the queue payload before starting durable inventory extraction.
export async function processInventoryUploadJob(job: Job) {
  if (job.name !== 'process-inventory') throw new Error(`Unsupported inventory job: ${job.name}`);
  const payload = payloadSchema.parse(job.data);
  return extractInventoryUpload(payload.uploadJobId);
}
