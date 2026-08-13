import 'dotenv/config';
import mongoose from 'mongoose';

// Falls back to a local default so tests run without Docker if a test Mongo is up on localhost.
const TEST_MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/motorx_test';

export async function connectTestDb(): Promise<void> {
  await mongoose.connect(TEST_MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
}

export async function clearTestDb(): Promise<void> {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
  );
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect();
}
