// BullMQ options for every inventory job, shared by the backend (first enqueue) and the worker
// (re-enqueues by the reaper) so a job retries the same way wherever it was queued.
// Temporary failures retry after about 5s, 10s, then 20s; jitter spreads retries of many jobs that
// failed together (e.g. a storage outage) so they do not all hit the recovering service at once.
// The total number of attempts is also capped durably by the job's attempt count in MongoDB.
export const INVENTORY_JOB_OPTIONS = {
  attempts: 4,
  backoff: { type: 'exponential', delay: 5_000, jitter: 0.5 },
  removeOnComplete: 500,
  removeOnFail: 1_000,
} as const;

export const inventoryBullJobId = {
  csv: (uploadJobId: string) => uploadJobId,
  images: (uploadJobId: string) => `${uploadJobId}-images`,
} as const;
