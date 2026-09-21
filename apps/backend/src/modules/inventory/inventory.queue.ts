import { inventoryQueue } from '../../config/queue.js';

// Publishes only the durable MongoDB job ID, keeping CSV content out of Redis.
export async function enqueueInventoryUpload(uploadJobId: string) { await inventoryQueue.add('process-inventory', { uploadJobId }, { jobId: uploadJobId }); }

// Publishes the same durable job ID for the second, image-processing stage. A distinct BullMQ
// jobId (suffixed) avoids colliding with the CSV job that already used the bare uploadJobId.
export async function enqueueInventoryImages(uploadJobId: string) { await inventoryQueue.add('process-inventory-images', { uploadJobId }, { jobId: `${uploadJobId}-images` }); }
