import { apiClient } from '../../../shared/services/apiClient';
import { listingsResponseSchema } from '../schemas/listing.schema';
import { listingSchema } from '../schemas/listing.schema';
import type { CreateListingInput, Listing, ListingsResponse } from '../types/listing.types';

export async function getListings(page = 1, limit = 20): Promise<ListingsResponse> {
  const response = await apiClient.get('/listings', { params: { page, limit } });
  return listingsResponseSchema.parse(response.data);
}

export async function getListing(listingId: string): Promise<Listing> {
  const response = await apiClient.get(`/listings/${listingId}`);
  return listingSchema.parse(response.data.data);
}

export async function createListing(input: CreateListingInput): Promise<Listing> {
  const response = await apiClient.post('/listings', input);
  return listingSchema.parse(response.data.data);
}
