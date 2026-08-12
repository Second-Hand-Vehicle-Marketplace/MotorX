import { Router } from 'express';
import { loadLocalUser } from '../../shared/middleware/loadLocalUser.js';
import { requireAuthenticated } from '../../shared/middleware/requireAuthenticated.js';
import { verifyFirebaseToken } from '../../shared/middleware/verifyFirebaseToken.js';
import type { AuthenticatedRequest } from '../../shared/types/authenticatedRequest.js';

export const authUserRouter = Router();

authUserRouter.get(
  '/me',
  verifyFirebaseToken,
  loadLocalUser,
  requireAuthenticated,
  (request: AuthenticatedRequest, response) => {
    const user = request.localUser!;
    response.json({
      success: true,
      data: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName ?? null,
        role: user.role,
        status: user.status,
      },
      meta: null,
    });
  },
);
