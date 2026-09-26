import { JOB_LEASE_MS } from '../repositories/uploadJob.repository.js';

// Thrown when this worker's lease was taken over (it expired and another worker claimed the job).
// The job now belongs to someone else, so the current attempt must stop without writing anything.
export class LeaseLostError extends Error {
  constructor(uploadJobId: string) { super(`Lease for upload job ${uploadJobId} was lost to another worker.`); this.name = 'LeaseLostError'; }
}

export interface HeldLease {
  readonly owner: string;
  // Throws LeaseLostError if a renewal found the job owned by another worker.
  assertHeld(): void;
  stop(): void;
}

// Renews the lease every third of its duration while the job runs. A failed renewal caused by a
// database hiccup is retried on the next tick; only "another worker owns it" marks the lease lost.
export function holdLease(uploadJobId: string, owner: string, renew: (uploadJobId: string, owner: string) => Promise<boolean>, intervalMs = JOB_LEASE_MS / 3): HeldLease {
  let lost = false;
  const timer = setInterval(() => {
    renew(uploadJobId, owner)
      .then((stillHeld) => { if (!stillHeld) lost = true; })
      .catch((error) => console.warn('Lease renewal failed; will retry.', { uploadJobId, message: error instanceof Error ? error.message : String(error) }));
  }, intervalMs);
  timer.unref();
  return {
    owner,
    assertHeld() { if (lost) throw new LeaseLostError(uploadJobId); },
    stop() { clearInterval(timer); },
  };
}
