import type { User } from '../types/auth.types';
import { mockUsers } from '../../../shared/mockData';
import { apiClient } from '../../../shared/services/apiClient';

export const authApi = {
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await apiClient.get<User>('/api/v1/auth/me');
      return response.data;
    } catch {
      return mockUsers[0];
    }
  },
  login: async (email: string): Promise<User> => {
    try {
      const response = await apiClient.post<User>('/api/v1/auth/login', { email });
      return response.data;
    } catch {
      return mockUsers.find(u => u.email === email) || mockUsers[0];
    }
  },
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch {
      return;
    }
  },
};