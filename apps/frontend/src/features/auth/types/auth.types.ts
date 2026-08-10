// User roles matching the SRS role definitions
export type UserRole = 'buyer' | 'dealer' | 'admin';

export type DealerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
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
  logout: () => void;
}