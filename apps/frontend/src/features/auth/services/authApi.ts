import type { ApiSuccessResponse, AuthUserDto } from '@motorx/shared-contracts';
import type { User } from '../types/auth.types';
import { apiClient } from '../../../shared/services/apiClient';

function toFrontendUser(user: AuthUserDto): User {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName ?? user.email.split('@')[0],
    phone: user.phone ?? undefined,
    role: user.role,
    ...(user.role === 'dealer' ? { dealerStatus: 'approved' as const } : {}),
    createdAt: '',
    lastLoginAt: '',
    isActive: user.status === 'active',
  };
}

export const authApi = {
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<ApiSuccessResponse<AuthUserDto>>('/auth/me');
    return toFrontendUser(response.data.data);
  },
  updateProfile: async (displayName: string, phone: string): Promise<User> => {
    const response = await apiClient.patch<ApiSuccessResponse<AuthUserDto>>('/auth/me', { displayName, phone });
    return toFrontendUser(response.data.data);
  },
};
