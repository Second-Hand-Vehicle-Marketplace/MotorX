import type {
  DealerApplicationStatus,
  ListingStatus,
  NotificationChannel,
  NotificationEmailStatus,
  NotificationType,
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
  // When the verification files were deleted under the retention policy, if they have been.
  documentsDeletedAt: string | null;
  // When this version of the application was (re)submitted.
  submittedAt: string;
  // Earlier rejected submissions, oldest first.
  reviewHistory: Array<{ status: 'rejected'; reason: string | null; reviewedAt: string | null; submittedAt: string | null }>;
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

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  emailStatus: NotificationEmailStatus;
  read: boolean;
  details?: Record<string, string | number | null>;
  createdAt: string;
}

export interface ListingImageDto {
  key: string;
  url: string;
  // Small copy (max 800 px) for cards and phones; null for photos stored before small copies existed.
  thumbUrl: string | null;
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
  // When the dealer last confirmed the listing is current (published, edited, re-priced, or
  // marked "still available"). Drives the stale-stock reminders.
  lastConfirmedAt: string | null;
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

// A published listing the dealer has not touched for this many days counts as stale stock.
export const STALE_LISTING_DAYS = 60;

// One action applied to many of a dealer's listings at once. Listings that are not in a status
// the action applies to (e.g. publishing one that is already sold) are skipped, not failed.
export const bulkListingActions = ['publish', 'mark-sold', 'archive', 'confirm-available', 'reduce-price', 'delete'] as const;
export type BulkListingAction = (typeof bulkListingActions)[number];
export const BULK_LISTING_MAX_IDS = 500;
export const BULK_PRICE_REDUCTION_MAX_PERCENT = 50;

export interface BulkListingActionInput {
  action: BulkListingAction;
  // Either the chosen listings, or every listing created by one CSV upload.
  listingIds?: string[];
  uploadJobId?: string;
  // Required for reduce-price: 1 to 50.
  percent?: number;
}

export interface BulkListingActionResult {
  action: BulkListingAction;
  // Listings found and owned by the dealer.
  matched: number;
  // Listings actually changed.
  updated: number;
  // Owned listings left unchanged because the action does not apply to their status.
  skipped: number;
}

export interface DealerListingStatsDto {
  total: number;
  active: number;
  draft: number;
  sold: number;
  archived: number;
  // Active listings not confirmed for STALE_LISTING_DAYS days.
  stale: number;
  staleAfterDays: number;
}
