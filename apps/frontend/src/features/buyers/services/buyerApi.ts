import type { ApiSuccessResponse, ListingDto, PaginationMeta } from '@motorx/shared-contracts';
import { apiClient } from '../../../shared/services/apiClient';
import type { Listing, ListingFilters, PaginatedResponse } from '../../listings/types/listing.types';

interface BuyerListingCollection { listings: ListingDto[]; pagination: PaginationMeta }
interface BuyerDealerDto { businessName: string; location: string; phone: string; email: string; description: string; website: string | null }
type BuyerListingDetailDto = ListingDto & { dealer: BuyerDealerDto | null };

// Converts the shared API contract into the buyer UI model.
function toBuyerListing(dto: ListingDto, dealer?: BuyerDealerDto | null): Listing {
  return {
    id: dto.id, dealerId: dto.dealerId, dealer: dealer ?? null, registrationNumber: dto.registrationNumber,
    title: dto.title, make: dto.make, model: dto.model, year: dto.year, price: dto.price, currency: dto.currency, location: dto.location,
    description: dto.description ?? '', images: dto.images.map((image, index) => ({ id: image.key, url: image.url, alt: image.alt ?? dto.title, isPrimary: index === 0 })),
    status: dto.status, publishedAt: dto.publishedAt, category: dto.category, attributes: dto.attributes,
  } as Listing;
}

export const buyerApi = {
  // Loads active marketplace vehicles with pagination inside response data.
  async listVehicles(filters: ListingFilters = {}, page = 1, limit = 20): Promise<PaginatedResponse<Listing>> {
    const response = await apiClient.get<ApiSuccessResponse<BuyerListingCollection>>('/listings', { params: { page, limit, ...filters } });
    const { listings, pagination } = response.data.data;
    return { data: listings.map((listing) => toBuyerListing(listing)), total: pagination.total, page: pagination.page, pageSize: pagination.limit, totalPages: pagination.totalPages };
  },
  // Loads one active vehicle, with its dealer's public profile, for the details page.
  async getVehicle(listingId: string) { const response = await apiClient.get<ApiSuccessResponse<BuyerListingDetailDto>>(`/listings/${listingId}`); return toBuyerListing(response.data.data, response.data.data.dealer); },
};
