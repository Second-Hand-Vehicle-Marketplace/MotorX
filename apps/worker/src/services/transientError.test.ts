import { describe, expect, it } from 'vitest';
import { isTransientError } from './transientError.js';

describe('isTransientError', () => {
  it.each([
    ['a dropped connection', Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' })],
    ['S3 throttling', Object.assign(new Error('Please reduce your request rate.'), { name: 'SlowDown' })],
    ['an S3 5xx response', Object.assign(new Error('Internal'), { $metadata: { httpStatusCode: 503 } })],
    ['an SDK-marked retryable error', Object.assign(new Error('x'), { $retryable: { throttling: false } })],
    ['MongoDB being unreachable', Object.assign(new Error('Server selection timed out'), { name: 'MongoServerSelectionError' })],
    ['a wrapped network error', new Error('download failed', { cause: Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }) })],
  ])('retries %s', (_label, error) => {
    expect(isTransientError(error)).toBe(true);
  });

  it.each([
    ['a missing file', Object.assign(new Error('The specified key does not exist.'), { name: 'NoSuchKey', $metadata: { httpStatusCode: 404 } })],
    ['access denied', Object.assign(new Error('Access Denied'), { name: 'AccessDenied', $metadata: { httpStatusCode: 403 } })],
    ['a CSV parse error', Object.assign(new Error('Invalid Record Length'), { code: 'CSV_RECORD_INCONSISTENT_COLUMNS' })],
    ['a duplicate key error', Object.assign(new Error('E11000 duplicate key error'), { name: 'MongoServerError', code: 11000 })],
    ['a programming error', new TypeError('Cannot read properties of undefined')],
    ['a non-error value', 'boom'],
  ])('does not retry %s', (_label, error) => {
    expect(isTransientError(error)).toBe(false);
  });
});
