import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

const port = env.PORT;

await connectDatabase();

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`MotorX backend is running on port ${port}.`);
});

function shutdown(signal: string): void {
  console.log(`Received ${signal}. Shutting down backend.`);

  server.close(async (error) => {
    if (error) {
      console.error('Backend shutdown failed.', error);
      process.exit(1);
    }

    await disconnectDatabase();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
