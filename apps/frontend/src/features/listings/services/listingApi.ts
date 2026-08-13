import type {
  ApiSuccessResponse,
  CreateListingInput,
  ListingDto,
  ListResponseMeta,
  UpdateListingInput,
  UpdateListingStatusInput,
} from '@motorx/shared-contracts';
import { apiClient } from '../../../shared/services/apiClient';
import type { Listing, ListingFilters, PaginatedResponse } from '../types/listing.types';

function toListing(dto: ListingDto): Listing {
  return {
    id: dto.id,
    dealerId: dto.dealerId,
    title: dto.title,
    make: dto.make,
    model: dto.model,
    year: dto.year,
    price: dto.price,
    currency: dto.currency,
    mileage: dto.mileageKm,
    fuelType: dto.fuelType,
    transmission: dto.transmission,
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
  };
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
  async getListings(filters: ListingFilters = {}, page = 1, limit = 20): Promise<PaginatedResponse<Listing>> {
    const response = await apiClient.get<ApiSuccessResponse<ListingDto[], ListResponseMeta>>('/listings', {
      params: { page, limit, ...filters },
    });
    return toPaginatedResponse(response.data);
  },

  async getListingById(id: string): Promise<Listing> {
    const response = await apiClient.get<ApiSuccessResponse<ListingDto>>(`/listings/${id}`);
    return toListing(response.data.data);
  },

  async getMyListings(page = 1, limit = 20): Promise<PaginatedResponse<Listing>> {
    const response = await apiClient.get<ApiSuccessResponse<ListingDto[], ListResponseMeta>>('/listings/mine', {
      params: { page, limit },
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
};
