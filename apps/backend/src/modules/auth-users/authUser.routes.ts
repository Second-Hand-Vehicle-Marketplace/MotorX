import { Router } from 'express';
import type { AuthUserDto } from '@motorx/shared-contracts';
import { loadLocalUser } from '../../shared/middleware/loadLocalUser.js';
import { requireAuthenticated } from '../../shared/middleware/requireAuthenticated.js';
import { verifyFirebaseToken } from '../../shared/middleware/verifyFirebaseToken.js';
import { sendSuccess } from '../../shared/responses/apiResponse.js';
import type { AuthenticatedRequest } from '../../shared/types/authenticatedRequest.js';

export const authUserRouter = Router();

authUserRouter.get(
  '/me',
  verifyFirebaseToken,
  loadLocalUser,
  requireAuthenticated,
  (request: AuthenticatedRequest, response) => {
    const user = request.localUser!;
    const dto: AuthUserDto = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName ?? null,
      role: user.role,
      status: user.status,
    };
    sendSuccess(response, dto);
  },
);
