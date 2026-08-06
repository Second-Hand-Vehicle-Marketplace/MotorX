console.log('MotorX worker is running.');

const heartbeat = setInterval(() => {
  console.log('MotorX worker heartbeat.');
}, 15_000);

function shutdown(signal: string): void {
  console.log(`Received ${signal}. Shutting down worker.`);
  clearInterval(heartbeat);
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
