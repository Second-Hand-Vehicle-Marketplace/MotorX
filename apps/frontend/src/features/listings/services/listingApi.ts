import { apiClient } from '../../../shared/services/apiClient';
import { listingsResponseSchema } from '../schemas/listing.schema';
import { listingSchema } from '../schemas/listing.schema';
import type { CreateListingInput, Listing, ListingsResponse, ReorderListingImagesInput, UpdateListingInput, UpdateListingStatusInput } from '../types/listing.types';

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

export async function getMyListings(page = 1, limit = 20): Promise<ListingsResponse> {
  const response = await apiClient.get('/listings/mine', { params: { page, limit } });
  return listingsResponseSchema.parse(response.data);
}

export async function updateListing(listingId: string, input: UpdateListingInput): Promise<Listing> {
  const response = await apiClient.patch(`/listings/${listingId}`, input);
  return listingSchema.parse(response.data.data);
}

export async function updateListingStatus(listingId: string, input: UpdateListingStatusInput): Promise<Listing> {
  const response = await apiClient.patch(`/listings/${listingId}/status`, input);
  return listingSchema.parse(response.data.data);
}

export async function uploadListingImage(listingId: string, image: File, alt?: string): Promise<Listing> {
  const form = new FormData();
  form.append('image', image);
  if (alt) form.append('alt', alt);
  const response = await apiClient.post(`/listings/${listingId}/images`, form);
  return listingSchema.parse(response.data.data);
}

export async function deleteListingImage(listingId: string, imageKey: string): Promise<Listing> {
  const response = await apiClient.delete(`/listings/${listingId}/images/${encodeURIComponent(imageKey)}`);
  return listingSchema.parse(response.data.data);
}

export async function reorderListingImages(listingId: string, input: ReorderListingImagesInput): Promise<Listing> {
  const response = await apiClient.patch(`/listings/${listingId}/images/reorder`, input);
  return listingSchema.parse(response.data.data);
}
