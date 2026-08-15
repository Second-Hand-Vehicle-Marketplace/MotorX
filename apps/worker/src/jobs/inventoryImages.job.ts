import type { Job } from 'bullmq';
import { z } from 'zod';
import { processInventoryImages } from '../services/imageProcessing.service.js';

const payloadSchema = z.object({ uploadJobId: z.string().regex(/^[a-f\d]{24}$/i) });

// Validates the queue payload before starting durable vehicle-photos extraction.
export async function processInventoryImagesJob(job: Job) {
  const payload = payloadSchema.parse(job.data);
  return processInventoryImages(payload.uploadJobId);
}
