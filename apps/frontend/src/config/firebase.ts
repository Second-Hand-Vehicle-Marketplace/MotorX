import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const env = ((import.meta as any).env ?? {}) as Record<string, string | undefined>;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyBOGN7EbDSN7SXso4pIQ7EOJXX00GrFZ64',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'motorx-aece4.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'motorx-aece4',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'motorx-aece4.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '936266509757',
  appId: env.VITE_FIREBASE_APP_ID || '1:936266509757:web:4f8edc437bbd5e6a6176d4',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-LDXR73XKV5',
} as const;

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);