export interface ListingImage {
  key: string;
  url: string;
  alt: string | null;
  order: number;
}

export interface Listing {
  id: string;
  dealerId: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  mileageKm: number;
  fuelType: 'petrol' | 'diesel' | 'hybrid' | 'electric' | 'other';
  transmission: 'automatic' | 'manual' | 'other';
  location: string;
  description: string | null;
  images: ListingImage[];
  status: 'draft' | 'active' | 'sold' | 'archived';
  publishedAt: string | null;
}

export type CreateListingInput = Pick<Listing, 'title' | 'make' | 'model' | 'year' | 'price' | 'currency' | 'mileageKm' | 'fuelType' | 'transmission' | 'location'> & {
  description?: string;
  status: 'draft' | 'active';
};

export interface ListingPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListingsResponse {
  success: true;
  data: Listing[];
  meta: { pagination: ListingPagination };
}
