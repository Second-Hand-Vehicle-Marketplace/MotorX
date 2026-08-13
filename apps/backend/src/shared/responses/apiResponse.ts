import type { Response } from 'express';
import type { ApiSuccessResponse } from '@motorx/shared-contracts';

// Sends the standard MotorX success envelope with optional status and metadata.
export function sendSuccess<T, M = null>(response: Response, data: T, options?: { status?: number; meta?: M }): void {
  const body: ApiSuccessResponse<T, M> = {
    success: true,
    data,
    meta: (options?.meta ?? null) as M,
  };
  response.status(options?.status ?? 200).json(body);
}
