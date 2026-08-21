import type { ErrorRequestHandler } from 'express';
import type { ApiErrorResponse } from '@motorx/shared-contracts';
import { AppError } from '../errors/AppError.js';
import { errorCodes } from '../errors/errorCodes.js';

// Converts application and unexpected errors into the standard error envelope.
export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const known = error instanceof AppError;
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
