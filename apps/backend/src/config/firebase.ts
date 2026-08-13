import admin from 'firebase-admin';
import { env } from './env.js';

export const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyBOGN7EbDSN7SXso4pIQ7EOJXX00GrFZ64',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'motorx-aece4.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID ?? 'motorx-aece4',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'motorx-aece4.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '936266509757',
  appId: process.env.VITE_FIREBASE_APP_ID ?? '1:936266509757:web:4f8edc437bbd5e6a6176d4',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-LDXR73XKV5',
} as const;

export function initializeFirebaseAdmin(): admin.app.App | null {
  const projectId = env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey = env.FIREBASE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    console.warn('Firebase Admin SDK is not configured; skipping server-side Firebase initialization.');
    return null;
  }

  if (admin.apps.length > 0) {
    return admin.app();
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
    projectId,
  });

  console.log('Firebase Admin SDK initialized successfully.');
  return admin.app();
}

export function getFirebaseAdmin(): admin.app.App | null {
  return admin.apps[0] ?? null;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  const app = getFirebaseAdmin();
  if (!app) {
    return null;
  }

  return app.auth().verifyIdToken(idToken);
}
