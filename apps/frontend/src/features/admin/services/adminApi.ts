import type { ApiSuccessResponse, PaginationMeta } from '@motorx/shared-contracts';
import type { UserRole } from '../../auth/types/auth.types';
import { apiClient } from '../../../shared/services/apiClient';

export interface AdminUser {
  id: string; email: string; displayName: string; role: UserRole;
  status: 'active' | 'suspended'; phone?: string; createdAt: string; lastLoginAt: string;
}

export interface AdminListing {
  id: string; dealerId: string; dealerName: string; title: string; make: string; model: string;
  year: number; price: number; currency: string; status: 'draft' | 'active' | 'sold' | 'archived'; createdAt: string;
}

export interface AdminStats {
  totalUsers: number; registeredDealers: number; totalListings: number; pendingDealerApplications: number;
}

export type AdminAuditEvent = 'dealer_approved' | 'dealer_rejected' | 'user_suspended' | 'user_activated' | 'listing_removed';
export interface AdminAuditLog { id: string; eventType: AdminAuditEvent; actorId: string; actorName: string; targetId: string; targetName: string; details: string; timestamp: string }
export interface AdminUpload { id: string; dealerId: string; dealerName: string; fileName: string; fileSize: number; status: 'pending' | 'processing' | 'completed' | 'completedWithErrors' | 'failed'; totalRecords: number; processedRecords: number; validRecords: number; rejectedRecords: number; failureReason: string | null; createdAt: string; completedAt: string | null }
export interface AdminSystemHealth { checkedAt: string; backend: { status: string; uptimeSeconds: number }; database: { status: string; readyState: number }; queue: { status: string }; worker: { status: string } }

export interface AdminUserFilters { search?: string; role?: UserRole; status?: AdminUser['status']; page?: number; limit?: number }
export interface AdminListingFilters { search?: string; status?: AdminListing['status']; page?: number; limit?: number }

// Provides one frontend entry point for every admin API operation.
export const adminApi = {
  async listUsers(filters: AdminUserFilters = {}) {
    const response = await apiClient.get<ApiSuccessResponse<AdminUser[], PaginationMeta>>('/admin/users', { params: filters });
    return { users: response.data.data, meta: response.data.meta };
  },
  async setUserStatus(userId: string, status: AdminUser['status']) {
    const response = await apiClient.patch<ApiSuccessResponse<AdminUser>>(`/admin/users/${userId}`, { status });
    return response.data.data;
  },
  async listListings(filters: AdminListingFilters = {}) {
    const response = await apiClient.get<ApiSuccessResponse<AdminListing[], PaginationMeta>>('/admin/listings', { params: filters });
    return { listings: response.data.data, meta: response.data.meta };
  },
  async removeListing(listingId: string) {
    const response = await apiClient.delete<ApiSuccessResponse<AdminListing>>(`/admin/listings/${listingId}`);
    return response.data.data;
  },
  async getStats() {
    const response = await apiClient.get<ApiSuccessResponse<AdminStats>>('/admin/stats');
    return response.data.data;
  },
  async listAuditLogs(eventType?: AdminAuditEvent) {
    const response = await apiClient.get<ApiSuccessResponse<AdminAuditLog[], PaginationMeta>>('/admin/audit-logs', { params: { eventType, limit: 100 } });
    return response.data.data;
  },
  async listUploads() {
    const response = await apiClient.get<ApiSuccessResponse<AdminUpload[], PaginationMeta>>('/admin/uploads', { params: { limit: 100 } });
    return response.data.data;
  },
  async getSystemHealth() {
    const response = await apiClient.get<ApiSuccessResponse<AdminSystemHealth>>('/admin/system-health');
    return response.data.data;
  },
};
