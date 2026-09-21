import type { ErrorRequestHandler } from 'express';
import type { ApiErrorResponse } from '@motorx/shared-contracts';
import { AppError } from '../errors/AppError.js';
import { errorCodes } from '../errors/errorCodes.js';
import { logger } from '../../config/logger.js';

// Converts application and unexpected errors into the standard error envelope.
export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const known = error instanceof AppError;
  if (!known) logger.error({ err: error, method: request.method, path: request.path, requestId: request.header('x-request-id') }, 'Unhandled API error');
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: known ? error.code : errorCodes.internal,
      message: known ? error.message : 'An unexpected error occurred.',
      ...(known && error.fields ? { fields: error.fields } : {}),
    },
    meta: null,
  };
  response.status(known ? error.statusCode : 500).json(body);
};
