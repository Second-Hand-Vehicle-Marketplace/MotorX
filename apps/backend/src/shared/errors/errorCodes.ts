export const errorCodes = {
  validation: 'VALIDATION_ERROR',
  unauthorized: 'UNAUTHORIZED',
  forbidden: 'FORBIDDEN',
  notFound: 'NOT_FOUND',
  conflict: 'CONFLICT',
  rateLimited: 'RATE_LIMITED',
  quotaExceeded: 'QUOTA_EXCEEDED',
  busy: 'SERVICE_BUSY',
  internal: 'INTERNAL_SERVER_ERROR',
} as const;
