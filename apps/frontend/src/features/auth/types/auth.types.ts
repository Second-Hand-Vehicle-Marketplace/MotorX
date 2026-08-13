// User roles matching the SRS role definitions
export type UserRole = 'buyer' | 'dealer' | 'admin';

export type DealerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface BuyerRegistrationInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface DealerApplicationInput {
  applicantName: string;
  email: string;
  phone: string;
  password: string;
  businessName: string;
  businessLicense: string;
  address: string;
  city?: string;
  province?: string;
  businessContact?: string;
  businessEmail?: string;
  website?: string;
  dealershipType?: 'new' | 'used' | 'both';
  brandFocus?: string;
  businessDescription?: string;
  inventoryCount?: string;
  businessRegistration: File;
  identityProof: File;
  additionalDocument?: File;
}

export interface DealerApplication extends DealerApplicationInput {
  id: string;
  status: DealerStatus;
  appliedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  dealerStatus?: DealerStatus;
  businessName?: string;
  businessLicense?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
}

export interface DealerProfile {
  id: string;
  userId: string;
  businessName: string;
  contactPhone: string;
  address: string;
  status: DealerStatus;
  approvedAt?: string;
  totalListings: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  registerBuyer: (data: BuyerRegistrationInput) => Promise<void>;
  registerDealerApplication: (data: DealerApplicationInput) => Promise<DealerApplicationDto>;
  logout: () => Promise<void>;
}
import type { DealerApplicationDto } from '@motorx/shared-contracts';
