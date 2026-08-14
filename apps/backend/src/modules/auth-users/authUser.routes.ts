import { Router } from 'express';
import type { AuthUserDto } from '@motorx/shared-contracts';
import { z } from 'zod';
import { loadLocalUser } from '../../shared/middleware/loadLocalUser.js';
import { requireAuthenticated } from '../../shared/middleware/requireAuthenticated.js';
import { verifyFirebaseToken } from '../../shared/middleware/verifyFirebaseToken.js';
import { sendSuccess } from '../../shared/responses/apiResponse.js';
import type { AuthenticatedRequest } from '../../shared/types/authenticatedRequest.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';

export const authUserRouter = Router();

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
});

function serializeUser(user: AuthenticatedRequest['localUser']): AuthUserDto {
  if (!user) throw new Error('The authenticated user was not loaded.');
  return {
    id: user.id,
    firebaseUid: user.firebaseUid,
    email: user.email,
    displayName: user.displayName ?? null,
    phone: user.phone ?? null,
    role: user.role,
    status: user.status,
  };
}

authUserRouter.get(
  '/me',
  verifyFirebaseToken,
  loadLocalUser,
  requireAuthenticated,
  (request: AuthenticatedRequest, response) => {
    const user = request.localUser!;
    sendSuccess(response, serializeUser(user));
  },
);

authUserRouter.patch(
  '/me',
  verifyFirebaseToken,
  loadLocalUser,
  requireAuthenticated,
  validateRequest({ body: profileSchema }),
  async (request: AuthenticatedRequest, response, next) => {
    try {
      request.localUser!.displayName = request.body.displayName;
      request.localUser!.phone = request.body.phone;
      await request.localUser!.save();
      sendSuccess(response, serializeUser(request.localUser));
    } catch (error) { next(error); }
  },
);
