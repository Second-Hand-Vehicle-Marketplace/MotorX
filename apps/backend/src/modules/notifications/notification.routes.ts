import { Router } from 'express';
import { loadLocalUser } from '../../shared/middleware/loadLocalUser.js';
import { requireAuthenticated } from '../../shared/middleware/requireAuthenticated.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { verifyFirebaseToken } from '../../shared/middleware/verifyFirebaseToken.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { getMyNotifications, getMyUnreadNotificationCount, patchMyNotificationRead, patchMyNotificationsReadAll } from './notification.controller.js';
import { listNotificationsQuerySchema, notificationIdParamsSchema } from './notification.validation.js';

export const notificationRouter = Router();

// Every route in this module is scoped to the caller's own notification inbox.
notificationRouter.use(verifyFirebaseToken, loadLocalUser, requireAuthenticated);
notificationRouter.get('/', validateRequest({ query: listNotificationsQuerySchema }), asyncHandler(getMyNotifications));
notificationRouter.get('/unread-count', asyncHandler(getMyUnreadNotificationCount));
notificationRouter.patch('/:notificationId/read', validateRequest({ params: notificationIdParamsSchema }), asyncHandler(patchMyNotificationRead));
notificationRouter.patch('/read-all', asyncHandler(patchMyNotificationsReadAll));
