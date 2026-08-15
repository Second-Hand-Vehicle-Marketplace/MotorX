import type { VehicleDetails } from '@motorx/shared-contracts';

export type {
  BusAttributes, CarAttributes, CarBodyType, FuelType, MotorcycleAttributes, MotorcycleType,
  ThreeWheelerAttributes, TransmissionType, TruckAttributes, VanAttributes, VehicleCategory,
  VehicleCondition, VehicleDetails,
} from '@motorx/shared-contracts';

// Listing status values from the SRS
export type ListingStatus = 'active' | 'pending' | 'sold' | 'draft' | 'rejected' | 'archived';

export interface VehicleImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface ListingDealer {
  businessName: string;
  location: string;
  phone: string;
  email: string;
  description: string;
  website?: string | null;
}

// `category` + `attributes` come from VehicleDetails, so `listing.category === 'car'` narrows
// `listing.attributes` down to CarAttributes — same discriminated shape as the backend's ListingDto.
export type Listing = {
  id: string;
  dealerId: string;
  dealer?: ListingDealer | null;
  registrationNumber: string;

  make: string;
  model: string;
  year: number;

  price: number;
  currency: string;

  title: string;
  description: string;
  images: VehicleImage[];

  status: ListingStatus;
  createdAt?: string;
  updatedAt?: string;
  location?: string;
  publishedAt?: string | null;
  sourceUploadJobId?: string;
} & VehicleDetails;

export interface ListingFilters {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  category?: string;
  bodyType?: string;
  condition?: string;
  fuelType?: string;
  transmission?: string;
  status?: ListingStatus;
  search?: string;
  sortBy?: 'price-asc' | 'price-desc' | 'year-desc' | 'mileage-asc' | 'newest';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
