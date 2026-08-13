import mongoose from 'mongoose';
import { env } from './env.js';

export const databaseConfig = {
  mongoUri: env.MONGODB_URI,
  dbName: 'motorx',
} as const;

export async function connectDatabase(): Promise<void> {
  if (!databaseConfig.mongoUri) {
    console.warn('MongoDB URI is not configured; skipping database connection.');
    return;
  }

  try {
    await mongoose.connect(databaseConfig.mongoUri, {
      dbName: databaseConfig.dbName,
    });
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection failed:', error instanceof Error ? error.message : error);
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  } catch (error) {
    console.error('MongoDB disconnect failed:', error instanceof Error ? error.message : error);
  }
}
