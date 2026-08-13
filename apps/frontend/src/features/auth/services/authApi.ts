import type { User } from '../types/auth.types';
import { apiClient } from '../../../shared/services/apiClient';
import { firebaseAuth } from '../../../config/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

export const authApi = {
  getCurrentUser: async (): Promise<User> => {
    const idToken = await firebaseAuth.currentUser?.getIdToken();
    const response = await apiClient.get<{ data: User }>('/auth/me', {
      headers: idToken ? { Authorization: `Bearer ${idToken}` } : undefined,
    });
    return response.data.data;
  },
  login: async (email: string, password: string): Promise<User> => {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const idToken = await credential.user.getIdToken();
    const response = await apiClient.post<{ data: User }>('/auth/login', { idToken });
    return response.data.data;
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    await signOut(firebaseAuth);
  },
};