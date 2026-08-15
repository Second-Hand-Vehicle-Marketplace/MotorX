import type { ApiSuccessResponse, PaginationMeta, VehicleCategory } from '@motorx/shared-contracts';
import { apiClient } from '../../../shared/services/apiClient';
import type { PaginatedResponse } from '../../listings/types/listing.types';
import type { RejectedRecord, UploadJob } from '../types/inventory.types';

function toPaginated<T>(items: T[], pagination: PaginationMeta): PaginatedResponse<T> {
  return { data: items, total: pagination.total, page: pagination.page, pageSize: pagination.limit, totalPages: pagination.totalPages };
}

export const inventoryApi = {
  async uploadCsv(category: VehicleCategory, file: File, onProgress?: (percent: number) => void): Promise<UploadJob> {
    const formData = new FormData();
    formData.append('category', category);
    formData.append('file', file);
    const response = await apiClient.post<ApiSuccessResponse<UploadJob>>('/dealer/uploads', formData, {
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
    return response.data.data;
  },

  // Downloads the category CSV template and returns it as a browser-savable Blob.
  async downloadTemplate(category: VehicleCategory): Promise<Blob> {
    const response = await apiClient.get(`/dealer/uploads/template/${category}`, { responseType: 'blob' });
    return response.data as Blob;
  },

  // Attaches a vehicle-photos zip (one folder per registration number) to a finished CSV upload.
  async uploadImagesZip(uploadId: string, file: File, onProgress?: (percent: number) => void): Promise<UploadJob> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiSuccessResponse<UploadJob>>(`/dealer/uploads/${uploadId}/images`, formData, {
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
    return response.data.data;
  },

  async listUploads(page = 1, limit = 20): Promise<PaginatedResponse<UploadJob>> {
    const response = await apiClient.get<ApiSuccessResponse<{ uploads: UploadJob[]; pagination: PaginationMeta }>>('/dealer/uploads', {
      params: { page, limit },
    });
    return toPaginated(response.data.data.uploads, response.data.data.pagination);
  },

  async getUpload(uploadId: string): Promise<UploadJob> {
    const response = await apiClient.get<ApiSuccessResponse<UploadJob>>(`/dealer/uploads/${uploadId}`);
    return response.data.data;
  },

  async getRejectedRecords(uploadId: string, page = 1, limit = 50): Promise<PaginatedResponse<RejectedRecord>> {
    const response = await apiClient.get<ApiSuccessResponse<{ records: RejectedRecord[]; pagination: PaginationMeta }>>(`/dealer/uploads/${uploadId}/rejected-records`, {
      params: { page, limit },
    });
    return toPaginated(response.data.data.records, response.data.data.pagination);
  },
};
