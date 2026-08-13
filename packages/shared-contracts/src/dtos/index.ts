import type {
  DealerApplicationStatus,
  FuelType,
  ListingStatus,
  TransmissionType,
  UserRole,
  UserStatus,
} from '../enums/index.js';

export interface AuthUserDto {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  status: UserStatus;
}

export interface DealerApplicationDto {
  id: string;
  userId: string;
  businessName: string;
  registrationNumber: string;
  phone: string;
  address: string;
  status: DealerApplicationStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateDealerApplicationInput = Pick<
  DealerApplicationDto,
  'businessName' | 'registrationNumber' | 'phone' | 'address'
>;

export interface ListingImageDto {
  key: string;
  url: string;
  alt: string | null;
  order: number;
}

export interface ListingDto {
  id: string;
  dealerId: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  mileageKm: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  location: string;
  description: string | null;
  images: ListingImageDto[];
  status: ListingStatus;
  publishedAt: string | null;
}

export type CreateListingInput = Pick<
  ListingDto,
  'title' | 'make' | 'model' | 'year' | 'price' | 'currency' | 'mileageKm' | 'fuelType' | 'transmission' | 'location'
> & {
  description?: string;
  status?: Extract<ListingStatus, 'draft' | 'active'>;
};

export type UpdateListingInput = Partial<Pick<
  ListingDto,
  'title' | 'make' | 'model' | 'year' | 'price' | 'currency' | 'mileageKm' | 'fuelType' | 'transmission' | 'location'
>> & { description?: string | null };

export interface UpdateListingStatusInput {
  status: Extract<ListingStatus, 'active' | 'sold' | 'archived'>;
}

export interface ReorderListingImagesInput {
  imageKeys: string[];
}
