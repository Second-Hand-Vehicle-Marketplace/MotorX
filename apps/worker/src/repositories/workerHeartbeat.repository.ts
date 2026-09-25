import mongoose from 'mongoose';

interface WorkerHeartbeatDoc { _id: string; lastSeenAt: Date }

// Writes a single timestamped doc the backend's admin system-health endpoint reads to
// approximate worker liveness (a separate container it has no other way to observe).
export async function upsertWorkerHeartbeat() {
  await mongoose.connection.db
    ?.collection<WorkerHeartbeatDoc>('workerHeartbeats')
    .updateOne({ _id: 'worker' }, { $set: { lastSeenAt: new Date() } }, { upsert: true });
}
