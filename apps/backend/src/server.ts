import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { closeInventoryQueue } from './config/queue.js';
import { disconnectRedis } from './config/redis.js';

const port = env.PORT;

await connectDatabase();

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`MotorX backend is running on port ${port}.`);
});

let shuttingDown = false;

// Stops accepting connections, lets in-flight requests finish, then releases MongoDB and Redis,
// all within SHUTDOWN_TIMEOUT_MS so the orchestrator never has to kill the process mid-cleanup.
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}. Shutting down backend (deadline ${env.SHUTDOWN_TIMEOUT_MS} ms).`);

  // Last resort if cleanup itself hangs (e.g. a dependency that never answers).
  const hardExit = setTimeout(() => { console.error('Backend shutdown deadline exceeded; exiting.'); process.exit(1); }, env.SHUTDOWN_TIMEOUT_MS + 5_000);
  hardExit.unref();

  // Idle keep-alive sockets would otherwise hold server.close() open until they time out.
  const drained = new Promise<void>((resolve) => server.close(() => resolve()));
  server.closeIdleConnections();
  let drainTimer: NodeJS.Timeout | undefined;
  const timedOut = await Promise.race([
    drained.then(() => false),
    new Promise<boolean>((resolve) => { drainTimer = setTimeout(() => resolve(true), env.SHUTDOWN_TIMEOUT_MS); }),
  ]);
  clearTimeout(drainTimer);
  if (timedOut) {
    console.warn('In-flight requests did not finish before the deadline; closing their connections.');
    server.closeAllConnections();
  }

  const results = await Promise.allSettled([disconnectDatabase(), closeInventoryQueue(), disconnectRedis()]);
  const failed = results.some((result) => result.status === 'rejected');
  if (failed) console.error('Backend shutdown cleanup failed.', results);
  process.exit(failed ? 1 : 0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
