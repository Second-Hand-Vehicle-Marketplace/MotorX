import type {
  ApiSuccessResponse,
  CreateListingInput,
  ListingDto,
  ListResponseMeta,
  UpdateListingInput,
  UpdateListingStatusInput,
} from '@motorx/shared-contracts';
import { apiClient } from '../../../shared/services/apiClient';
import type { Listing, PaginatedResponse } from '../types/listing.types';

function toListing(dto: ListingDto): Listing {
  return {
    id: dto.id,
    dealerId: dto.dealerId,
    registrationNumber: dto.registrationNumber,
    title: dto.title,
    make: dto.make,
    model: dto.model,
    year: dto.year,
    price: dto.price,
    currency: dto.currency,
    location: dto.location,
    description: dto.description ?? '',
    images: dto.images.map((image, index) => ({
      id: image.key,
      url: image.url,
      alt: image.alt ?? dto.title,
      isPrimary: index === 0,
    })),
    status: dto.status,
    publishedAt: dto.publishedAt,
    category: dto.category,
    attributes: dto.attributes,
  } as Listing;
}

function toPaginatedResponse(
  response: ApiSuccessResponse<ListingDto[], ListResponseMeta>,
): PaginatedResponse<Listing> {
  const { pagination } = response.meta;
  return {
    data: response.data.map(toListing),
    total: pagination.total,
    page: pagination.page,
    pageSize: pagination.limit,
    totalPages: pagination.totalPages,
  };
}

export const listingApi = {
  async getMyListingStats(): Promise<{ total: number; active: number; draft: number; sold: number; archived: number }> {
    const response = await apiClient.get<ApiSuccessResponse<{ total: number; active: number; draft: number; sold: number; archived: number }>>('/listings/mine/stats');
    return response.data.data;
  },
  async getMyListing(id: string): Promise<Listing> {
    const response = await apiClient.get<ApiSuccessResponse<ListingDto>>(`/listings/mine/${id}`);
    return toListing(response.data.data);
  },
  async getMyListings(page = 1, limit = 20, filters: { search?: string; status?: string; category?: string } = {}): Promise<PaginatedResponse<Listing>> {
    const response = await apiClient.get<ApiSuccessResponse<ListingDto[], ListResponseMeta>>('/listings/mine', {
      params: { page, limit, ...filters },
    });
    return toPaginatedResponse(response.data);
  },

  async createListing(input: CreateListingInput): Promise<Listing> {
    const response = await apiClient.post<ApiSuccessResponse<ListingDto>>('/listings', input);
    return toListing(response.data.data);
  },

  async updateListing(id: string, input: UpdateListingInput): Promise<Listing> {
    const response = await apiClient.patch<ApiSuccessResponse<ListingDto>>(`/listings/${id}`, input);
    return toListing(response.data.data);
  },

  async updateListingStatus(id: string, input: UpdateListingStatusInput): Promise<Listing> {
    const response = await apiClient.patch<ApiSuccessResponse<ListingDto>>(`/listings/${id}/status`, input);
    return toListing(response.data.data);
  },

  async uploadImage(id: string, file: File, alt?: string): Promise<Listing> {
    const formData = new FormData();
    formData.append('image', file);
    if (alt) formData.append('alt', alt);
    const response = await apiClient.post<ApiSuccessResponse<ListingDto>>(`/listings/${id}/images`, formData);
    return toListing(response.data.data);
  },

  async deleteImage(id: string, imageKey: string): Promise<Listing> {
    const response = await apiClient.delete<ApiSuccessResponse<ListingDto>>(`/listings/${id}/images/${encodeURIComponent(imageKey)}`);
    return toListing(response.data.data);
  },

  async reorderImages(id: string, imageKeys: string[]): Promise<Listing> {
    const response = await apiClient.patch<ApiSuccessResponse<ListingDto>>(`/listings/${id}/images/reorder`, { imageKeys });
    return toListing(response.data.data);
  },

  async deleteListing(id: string): Promise<void> {
    await apiClient.delete(`/listings/${id}`);
  },
};
