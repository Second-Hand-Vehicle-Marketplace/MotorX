import type { Listing, ListingFilters, PaginatedResponse } from '../types/listing.types';
import { apiClient } from '../../../shared/services/apiClient';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta: unknown;
};

const emptyPage = (pageSize = 9): PaginatedResponse<Listing> => ({
  data: [],
  total: 0,
  page: 1,
  pageSize,
  totalPages: 1,
});

export const listingApi = {
  getListings: async (filters: ListingFilters = {}): Promise<PaginatedResponse<Listing>> => {
    const response = await apiClient.get<ApiEnvelope<PaginatedResponse<Listing> | Listing[]>>('/listings', {
      params: filters,
    });

    const payload = response.data?.data;
    if (Array.isArray(payload)) {
      const pageSize = Number(filters.pageSize ?? (payload.length || 9));
      return {
        data: payload,
        total: payload.length,
        page: Number(filters.page ?? 1),
        pageSize,
        totalPages: 1,
      };
    }

    if (payload && Array.isArray((payload as PaginatedResponse<Listing>).data)) {
      return payload as PaginatedResponse<Listing>;
    }

    return emptyPage(Number(filters.pageSize ?? 9));
  },
  getListingById: async (id: string): Promise<Listing | null> => {
    const response = await apiClient.get<ApiEnvelope<Listing | null>>(`/listings/${id}`);
    return response.data?.data ?? null;
  },
  createListing: async (data: Partial<Listing>): Promise<Listing> => {
    const response = await apiClient.post<ApiEnvelope<Listing>>('/dealer/listings', data);
    return response.data.data;
  },
  updateListing: async (id: string, data: Partial<Listing>): Promise<Listing> => {
    const response = await apiClient.put<ApiEnvelope<Listing>>(`/listings/${id}`, data);
    return response.data.data;
  },
  createInquiry: async (id: string, data: { type: 'contact' | 'test_drive'; buyerName: string; buyerEmail: string; buyerPhone?: string; message?: string; preferredDate?: string }) => {
    const response = await apiClient.post<ApiEnvelope<{ id: string; status: string }>>(`/listings/${id}/inquiries`, data);
    return response.data.data;
  },
};