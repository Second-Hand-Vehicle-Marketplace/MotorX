import axios from 'axios';
import { firebaseAuthClient } from '../../config/firebase';
import { env } from '../../config/env';

export const apiClient = axios.create({
  baseURL: env.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }

  const firebaseUser = firebaseAuthClient.currentUser;

  if (firebaseUser) {
    const token = await firebaseUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
