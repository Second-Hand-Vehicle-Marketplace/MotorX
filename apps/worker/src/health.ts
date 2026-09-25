import { createServer, type Server } from 'node:http';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { redisConnection } from './config/redis.js';

// Minimal health server for the worker:
// - /health/live: the process is running and its event loop responds. Use this for container
//   restarts. It deliberately ignores MongoDB and Redis: restarting every worker because a shared
//   dependency is briefly down does not fix anything and only interrupts jobs.
// - /health/ready (and /health, kept for compatibility): MongoDB and Redis are connected, for
//   dashboards and alarms. Both checks read connection state only, so they never block.
export function startWorkerHealthServer(): Server {
  const server = createServer((request, response) => {
    if (request.url === '/health/live') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ status: 'UP' }));
      return;
    }
    if (request.url !== '/health' && request.url !== '/health/ready') {
      response.writeHead(404);
      response.end();
      return;
    }
    const mongoReady = mongoose.connection.readyState === 1;
    const redisReady = redisConnection.status === 'ready';
    const ok = mongoReady && redisReady;
    response.writeHead(ok ? 200 : 503, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ status: ok ? 'READY' : 'NOT_READY', mongo: mongoReady, redis: redisReady }));
  });
  server.listen(env.WORKER_HEALTH_PORT);
  return server;
}
