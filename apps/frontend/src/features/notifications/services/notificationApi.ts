import type { ApiSuccessResponse, NotificationDto, PaginationMeta } from '@motorx/shared-contracts';
import { apiClient } from '../../../shared/services/apiClient';

export const notificationApi = {
  async list(page = 1, limit = 20) {
    const response = await apiClient.get<ApiSuccessResponse<NotificationDto[], PaginationMeta>>('/notifications', { params: { page, limit } });
    return { notifications: response.data.data, meta: response.data.meta };
  },
  async unreadCount() {
    const response = await apiClient.get<ApiSuccessResponse<{ unreadCount: number }>>('/notifications/unread-count');
    return response.data.data.unreadCount;
  },
  async markRead(id: string) {
    await apiClient.patch(`/notifications/${id}/read`);
  },
  async markAllRead() {
    await apiClient.patch('/notifications/read-all');
  },
};
