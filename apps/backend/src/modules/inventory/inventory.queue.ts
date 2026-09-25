import { randomUUID } from 'node:crypto';
import { inventoryQueue } from '../../config/queue.js';

// Publishes only the durable MongoDB job ID, keeping CSV content out of Redis.
export async function enqueueInventoryUpload(uploadJobId: string) { await inventoryQueue.add('process-inventory', { uploadJobId }, { jobId: uploadJobId }); }

// Publishes a fresh BullMQ jobId per call — a dealer can attach photos more than once for the
// same upload, and a fixed/reused jobId would collide with the earlier (completed) job, causing
// BullMQ to silently skip enqueuing a new run while the DB status stays stuck at "pending".
export async function enqueueInventoryImages(uploadJobId: string) { await inventoryQueue.add('process-inventory-images', { uploadJobId }, { jobId: `${uploadJobId}-images-${randomUUID()}` }); }
