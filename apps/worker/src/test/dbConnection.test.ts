import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { connectTestDb, disconnectTestDb } from './db.js';

// Worker repositories aren't implemented yet (Sprint 3), so this proves the
// worker's test environment can reach the test database ahead of that work.
describe('worker test database connection', () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);

  it('connects to the configured MongoDB test database', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });
});
