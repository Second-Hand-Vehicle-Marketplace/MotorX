import type { Response } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import { sendSuccess } from '../../shared/responses/apiResponse.js';
import type { AuthenticatedRequest } from '../../shared/types/authenticatedRequest.js';
import { getNotificationsForUser, getUnreadNotificationCount, markAllNotificationsAsRead, markOneNotificationRead } from './notification.service.js';
import type { ListNotificationsQuery } from './notification.validation.js';

// Sends the current user's own notification inbox, newest first.
export async function getMyNotifications(request: AuthenticatedRequest, response: Response) {
  const query = request.query as unknown as ListNotificationsQuery;
  const result = await getNotificationsForUser(request.localUser!._id, query.page, query.limit);
  sendSuccess(response, result.data, { meta: result.meta });
}

// Sends the badge count used to render the unread bell indicator.
export async function getMyUnreadNotificationCount(request: AuthenticatedRequest, response: Response) {
  sendSuccess(response, await getUnreadNotificationCount(request.localUser!._id));
}

// Marks one notification the requesting user owns as read.
export async function patchMyNotificationRead(request: AuthenticatedRequest, response: Response) {
  const updated = await markOneNotificationRead(String(request.params.notificationId), request.localUser!._id) as { _id: unknown } | null;
  if (!updated) throw new AppError(404, errorCodes.notFound, 'The notification was not found.');
  sendSuccess(response, { id: String(updated._id) });
}

// Marks every unread notification for the requesting user as read.
export async function patchMyNotificationsReadAll(request: AuthenticatedRequest, response: Response) {
  await markAllNotificationsAsRead(request.localUser!._id);
  sendSuccess(response, { success: true });
}
