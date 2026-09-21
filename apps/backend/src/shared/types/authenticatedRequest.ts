import type { Request } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { AuthUserDocument } from '../../modules/auth-users/authUser.model.js';

export interface AuthenticatedRequest extends Request {
  firebaseUser?: DecodedIdToken;
  localUser?: AuthUserDocument;
}
