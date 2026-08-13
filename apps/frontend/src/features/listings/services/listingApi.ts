import type { Listing, ListingFilters, PaginatedResponse } from '../types/listing.types';
import { mockListings } from '../../../shared/mockData';
import { apiClient } from '../../../shared/services/apiClient';

export const listingApi = {
  getListings: async (filters: ListingFilters = {}): Promise<PaginatedResponse<Listing>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<Listing>>('/api/v1/listings', {
        params: filters,
      });
      return response.data;
    } catch {
      return {
        data: mockListings,
        total: mockListings.length,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };
    }
  },
  getListingById: async (id: string): Promise<Listing | null> => {
    try {
      const response = await apiClient.get<Listing | null>(`/api/v1/listings/${id}`);
      return response.data;
    } catch {
      return mockListings.find(l => l.id === id) || null;
    }
  },
  createListing: async (data: Partial<Listing>): Promise<Listing> => {
    try {
      const response = await apiClient.post<Listing>('/api/v1/dealer/listings', data);
      return response.data;
    } catch {
      const newListing: Listing = {
        id: `lst_${Date.now()}`,
        dealerId: 'usr_002',
        dealerName: 'Premium Autos',
        make: data.make || 'BMW',
        model: data.model || '3 Series',
        year: data.year || 2024,
        bodyType: data.bodyType || 'sedan',
        fuelType: data.fuelType || 'petrol',
        transmission: data.transmission || 'automatic',
        condition: data.condition || 'excellent',
        mileage: data.mileage || 1000,
        color: data.color || 'Black',
        price: data.price || 30000,
        currency: 'USD',
        title: data.title || 'New Listing',
        description: data.description || 'Description here',
        images: data.images || [{ id: 'img_1', url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&h=400&fit=crop', alt: 'Car', isPrimary: true }],
        status: 'active',
        views: 0,
        leads: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockListings.unshift(newListing);
      return newListing;
    }
  },
};