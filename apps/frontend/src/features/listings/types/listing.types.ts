// Listing status values from the SRS
export type ListingStatus = 'active' | 'pending' | 'sold' | 'draft' | 'rejected' | 'archived';

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'other' | 'plug-in-hybrid';
export type TransmissionType = 'automatic' | 'manual' | 'other' | 'cvt';
export type BodyType = 'sedan' | 'suv' | 'hatchback' | 'coupe' | 'truck' | 'van' | 'wagon' | 'convertible';
export type Condition = 'excellent' | 'good' | 'fair' | 'poor';

export interface VehicleImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface Listing {
  id: string;
  dealerId: string;
  dealerName?: string;

  // Vehicle info
  make: string;
  model: string;
  year: number;
  bodyType?: BodyType;
  fuelType: FuelType;
  transmission: TransmissionType;
  condition?: Condition;
  mileage: number;
  color?: string;
  vin?: string;

  // Pricing
  price: number;
  currency: string;

  // Content
  title: string;
  description: string;
  images: VehicleImage[];

  // Meta
  status: ListingStatus;
  views?: number;
  leads?: number;
  createdAt?: string;
  updatedAt?: string;
  location?: string;
  publishedAt?: string | null;
  sourceUploadJobId?: string;
}

export interface ListingFilters {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  bodyType?: BodyType;
  fuelType?: FuelType;
  transmission?: TransmissionType;
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

// Upload job types
export type UploadJobStatus = 'pending' | 'processing' | 'completed' | 'completedWithErrors' | 'failed';

export interface UploadJob {
  id: string;
  dealerId: string;
  dealerName: string;
  fileName: string;
  fileSize: number;
  status: UploadJobStatus;
  totalRecords: number;
  processedRecords: number;
  validRecords: number;
  rejectedRecords: number;
  createdAt: string;
  completedAt?: string;
}

export interface RejectedRecord {
  row: number;
  data: Record<string, string>;
  errors: string[];
}

// Audit log types
export type AuditEventType = 'dealer_approved' | 'dealer_rejected' | 'user_suspended' | 'user_activated' | 'listing_removed' | 'upload_completed';

export interface AuditLog {
  id: string;
  eventType: AuditEventType;
  actorId: string;
  actorName: string;
  targetId: string;
  targetName: string;
  details: string;
  timestamp: string;
}
