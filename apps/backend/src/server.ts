import { app } from './app.js';

const port = Number(process.env.PORT ?? 3000);

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`MotorX backend is running on port ${port}.`);
});

function shutdown(signal: string): void {
  console.log(`Received ${signal}. Shutting down backend.`);

  server.close((error) => {
    if (error) {
      console.error('Backend shutdown failed.', error);
      process.exit(1);
    }

    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
