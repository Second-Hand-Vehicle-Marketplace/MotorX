import { inventoryQueue } from '../../config/queue.js';

// Publishes only the durable MongoDB job ID, keeping CSV content out of Redis.
export async function enqueueInventoryUpload(uploadJobId: string) { await inventoryQueue.add('process-inventory', { uploadJobId }, { jobId: uploadJobId }); }
