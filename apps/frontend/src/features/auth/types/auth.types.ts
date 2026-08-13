import type { User } from 'firebase/auth';
import type { AuthUserDto, UserRole, UserStatus } from '@motorx/shared-contracts';

export type { UserRole, UserStatus };
export type LocalUser = AuthUserDto;

export interface AuthContextValue {
  firebaseUser: User | null;
  localUser: LocalUser | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string, displayName?: string): Promise<void>;
  logout(): Promise<void>;
  resetPassword(email: string): Promise<void>;
}
