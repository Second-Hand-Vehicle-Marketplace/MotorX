import { apiClient } from '../../../shared/services/apiClient';

export const adminApi = {
  getUsers: async () => {
    const response = await apiClient.get<{ data: any[] }>('/admin/users');
    return response.data.data;
  },
  getListings: async () => {
    const response = await apiClient.get<{ data: any[] }>('/admin/listings');
    return response.data.data;
  },
  getUploadJobs: async () => {
    const response = await apiClient.get<{ data: any[] }>('/admin/uploads');
    return response.data.data;
  },
  getAuditLogs: async () => {
    const response = await apiClient.get<{ data: any[] }>('/admin/audit-logs');
    return response.data.data;
  },
  toggleUserStatus: async (id: string, isActive: boolean) => {
    const response = await apiClient.patch<{ data: any }>(`/admin/users/${id}/status`, { isActive });
    return response.data.data;
  },
  updateDealerStatus: async (id: string, status: string) => {
    const response = await apiClient.patch<{ data: any }>(`/admin/dealers/${id}/status`, { status });
    return response.data.data;
  },
  updateListingStatus: async (id: string, status: string) => {
    const response = await apiClient.patch<{ data: any }>(`/admin/listings/${id}/status`, { status });
    return response.data.data;
  },
};
