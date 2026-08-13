import type { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRequestHandler = (request: Request, response: Response, next: NextFunction) => Promise<unknown>;

// Forwards rejected controller promises to Express error middleware.
export function asyncHandler(handler: AsyncRequestHandler): RequestHandler {
  return (request, response, next) => {
    void Promise.resolve(handler(request, response, next)).catch(next);
  };
}
