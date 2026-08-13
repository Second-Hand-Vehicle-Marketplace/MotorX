import axios from 'axios';
import { firebaseAuth } from '../../config/firebase';
import { env } from '../../config/env';

export const apiClient = axios.create({ baseURL: env.VITE_API_BASE_URL, timeout: 15_000 });

apiClient.interceptors.request.use(async (config) => {
  const user = firebaseAuth.currentUser;
  if (user) config.headers.Authorization = `Bearer ${await user.getIdToken()}`;
  return config;
});
