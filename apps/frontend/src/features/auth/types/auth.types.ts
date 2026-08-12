import type { User } from 'firebase/auth';

export type UserRole = 'buyer' | 'dealer' | 'admin';
export type UserStatus = 'active' | 'pending' | 'suspended';

export interface LocalUser {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  status: UserStatus;
}

export interface AuthContextValue {
  firebaseUser: User | null;
  localUser: LocalUser | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string, displayName?: string): Promise<void>;
  logout(): Promise<void>;
  resetPassword(email: string): Promise<void>;
}
