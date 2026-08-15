import type {
  DealerApplicationStatus,
  ListingStatus,
  UserRole,
  UserStatus,
} from '../enums/index.js';
import type { AnyVehicleAttributes, VehicleDetails } from '../vehicle/index.js';

export interface AuthUserDto {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
}

export interface UpdateAuthProfileInput {
  displayName: string;
  phone: string;
}

export interface DealerVerificationDocumentDto {
  category: 'businessRegistration' | 'identityProof' | 'additionalDocument';
  key: string;
  originalName: string;
  contentType: string;
  size: number;
}

export interface DealerApplicationDto {
  id: string;
  userId: string;
  businessName: string;
  registrationNumber: string;
  phone: string;
  address: string;
  representativeName: string;
  city: string;
  province: string;
  businessPhone: string;
  businessEmail: string;
  website: string | null;
  dealershipType: 'new' | 'used' | 'both';
  brands: string[];
  description: string;
  inventoryCount: number | null;
  verificationDocuments: DealerVerificationDocumentDto[];
  status: DealerApplicationStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateDealerApplicationInput = Pick<
  DealerApplicationDto,
  'representativeName' | 'businessName' | 'registrationNumber' | 'phone' | 'address' |
  'city' | 'province' | 'businessPhone' | 'businessEmail' | 'dealershipType' | 'description'
> & {
  website?: string;
  brands?: string[];
  inventoryCount?: number;
};

export interface ListingImageDto {
  key: string;
  url: string;
  alt: string | null;
  order: number;
}

// The `category`/`attributes` pair comes from VehicleDetails so `dto.category === 'car'`
// narrows `dto.attributes` down to CarAttributes automatically.
export type ListingDto = {
  id: string;
  dealerId: string;
  registrationNumber: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  location: string;
  description: string | null;
  images: ListingImageDto[];
  status: ListingStatus;
  publishedAt: string | null;
} & VehicleDetails;

export type CreateListingInput = {
  registrationNumber: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  location: string;
  description?: string;
  status?: Extract<ListingStatus, 'draft' | 'active'>;
} & VehicleDetails;

// Category is immutable after creation, so updates only touch common fields and the
// already-fixed category's attributes (typed as a loose known-field bag, not `any`).
export type UpdateListingInput = Partial<{
  registrationNumber: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  location: string;
  attributes: AnyVehicleAttributes;
}> & { description?: string | null };

export interface UpdateListingStatusInput {
  status: Extract<ListingStatus, 'active' | 'sold' | 'archived'>;
}

export interface ReorderListingImagesInput {
  imageKeys: string[];
}
