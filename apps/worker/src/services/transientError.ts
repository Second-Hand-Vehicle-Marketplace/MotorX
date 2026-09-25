const TRANSIENT_NETWORK_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EPIPE', 'EAI_AGAIN', 'ENOTFOUND', 'EHOSTUNREACH', 'ENETUNREACH', 'ESOCKETTIMEDOUT']);
const TRANSIENT_ERROR_NAMES = new Set([
  // AWS SDK / S3
  'TimeoutError', 'RequestTimeout', 'RequestTimeoutException', 'ServiceUnavailable', 'SlowDown', 'Throttling', 'ThrottlingException', 'InternalError',
  // MongoDB driver
  'MongoNetworkError', 'MongoNetworkTimeoutError', 'MongoServerSelectionError', 'MongoNotConnectedError', 'MongoPoolClearedError',
]);

// Decides whether a failure is worth retrying: network blips, storage throttling or 5xx errors,
// and database connectivity loss. Anything else (bad CSV, invalid archive, missing file,
// programming errors) is permanent, so retrying would only repeat the same failure.
export function isTransientError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { name?: string; code?: string; $retryable?: unknown; $metadata?: { httpStatusCode?: number }; hasErrorLabel?: (label: string) => boolean; cause?: unknown };
  if (candidate.name && TRANSIENT_ERROR_NAMES.has(candidate.name)) return true;
  if (candidate.code && TRANSIENT_NETWORK_CODES.has(candidate.code)) return true;
  if (candidate.$retryable) return true;
  const status = candidate.$metadata?.httpStatusCode;
  if (status !== undefined && (status >= 500 || status === 429)) return true;
  if (typeof candidate.hasErrorLabel === 'function' && (candidate.hasErrorLabel('RetryableWriteError') || candidate.hasErrorLabel('ResetPool'))) return true;
  return candidate.cause !== undefined && candidate.cause !== error ? isTransientError(candidate.cause) : false;
}
