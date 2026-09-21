import type { RequestHandler } from 'express';
import { ZodError, type ZodType } from 'zod';
import { AppError } from '../errors/AppError.js';
import { errorCodes } from '../errors/errorCodes.js';

interface RequestSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

// Parses selected request sections and rejects invalid input with HTTP 400.
export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (request, _response, next) => {
    try {
      if (schemas.body) request.body = schemas.body.parse(request.body);
      if (schemas.params) Object.assign(request.params, schemas.params.parse(request.params));
      if (schemas.query) Object.assign(request.query, schemas.query.parse(request.query));
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fields = error.flatten().fieldErrors as Record<string, string[]>;
        const summary = Object.entries(fields)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('; ');
        return next(new AppError(400, errorCodes.validation, summary || 'The request contains invalid values.', fields));
      }
      next(error);
    }
  };
}
