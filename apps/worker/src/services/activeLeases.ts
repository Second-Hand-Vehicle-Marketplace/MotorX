// Jobs this worker process currently holds a lease on, so a shutdown that runs out of time can
// hand them back as pending (resumable at once) instead of leaving them locked until the lease expires.
export type LeaseStage = 'csv' | 'images';

const active = new Map<string, { uploadJobId: string; stage: LeaseStage; owner: string }>();

export function trackLease(uploadJobId: string, stage: LeaseStage, owner: string) { active.set(owner, { uploadJobId, stage, owner }); }
export function untrackLease(owner: string) { active.delete(owner); }
export function listActiveLeases() { return [...active.values()]; }
