import mongoose from 'mongoose';
import { env } from './env.js';

// Opens the shared Mongoose connection before the API starts accepting requests.
export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
}

// Closes MongoDB cleanly during application shutdown.
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
