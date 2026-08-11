// User roles matching the SRS role definitions
export type UserRole = 'buyer' | 'dealer' | 'admin';

export type DealerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface DealerApplicationInput {
  applicantName: string;
  email: string;
  password: string;
  businessName: string;
  businessLicense: string;
  phone: string;
  address: string;
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
  login: (email: string, password: string) => Promise<void>;
  loginAsRole: (role: UserRole) => void;
  registerDealerApplication: (data: DealerApplicationInput) => DealerApplication;
  logout: () => void;
}