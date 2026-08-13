export const loggerConfig = {
  level: process.env.LOG_LEVEL ?? 'info',
  service: 'motorx-backend',
} as const;
