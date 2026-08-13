import { apiClient } from '../../../shared/services/apiClient';
import type { LocalUser } from '../types/auth.types';

interface MeResponse { success: true; data: LocalUser; meta: null }

export async function getCurrentLocalUser(): Promise<LocalUser> {
  const response = await apiClient.get<MeResponse>('/auth/me');
  return response.data.data;
}
