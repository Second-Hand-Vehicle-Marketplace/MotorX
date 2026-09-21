import 'dotenv/config';
import mongoose from 'mongoose';

const allowedLocalHosts = new Set(['127.0.0.1', 'localhost', 'mongodb']);

export function validateTestMongoUri(uri: string, allowRemote = process.env.ALLOW_REMOTE_TEST_DB === 'true'): string {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error('TEST_MONGODB_URI must be a valid MongoDB connection URI.');
  }
  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol)) {
    throw new Error('TEST_MONGODB_URI must use the mongodb:// or mongodb+srv:// scheme.');
  }
  if (!allowRemote && !allowedLocalHosts.has(parsed.hostname.toLowerCase())) {
    throw new Error(`Refusing to run destructive tests against remote MongoDB host "${parsed.hostname}". Set ALLOW_REMOTE_TEST_DB=true only for a dedicated disposable test database.`);
  }
  const databaseName = parsed.pathname.replace(/^\//, '');
  if (!/^motorx_test(?:[_-][a-z0-9-]+)?$/i.test(databaseName)) {
    throw new Error(`Refusing to run destructive tests against database "${databaseName || '(default)'}". Use a motorx_test database.`);
  }
  return uri;
}

export function getSafeTestMongoUri(): string {
  const uri = process.env.TEST_MONGODB_URI;
  if (!uri) throw new Error('TEST_MONGODB_URI is required for database tests. Refusing to use MONGODB_URI.');
  return validateTestMongoUri(uri);
}

export async function connectTestDb(): Promise<void> {
  await mongoose.connect(getSafeTestMongoUri(), { serverSelectionTimeoutMS: 10_000 });
}

export async function clearTestDb(): Promise<void> {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
  );
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect();
}
