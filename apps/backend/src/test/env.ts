// Import first in any test that loads config/env.ts (directly or through the app): env.ts validates
// the full backend configuration at import time. These harmless values apply only when unset, so
// CI or compose.test.yml settings (such as TEST_MONGODB_URI) still win. Imports run in order, so a
// plain `import '../test/env.js'` before other imports is enough.
const defaults: Record<string, string> = {
  MONGODB_URI: 'mongodb://127.0.0.1:27017/unused',
  REDIS_URL: 'redis://127.0.0.1:6379',
  FIREBASE_PROJECT_ID: 'test-project',
  FIREBASE_CLIENT_EMAIL: 'test@example.com',
  FIREBASE_PRIVATE_KEY: 'test-key',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_BUCKET: 'test-bucket',
  S3_ACCESS_KEY: 'test-access-key',
  S3_SECRET_KEY: 'test-secret-key',
  LOG_LEVEL: 'silent',
};
for (const [key, value] of Object.entries(defaults)) process.env[key] ??= value;
