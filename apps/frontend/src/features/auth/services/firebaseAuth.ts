import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { firebaseAuth } from '../../../config/firebase';

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
}

export async function registerWithEmail(email: string, password: string, displayName?: string) {
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
  if (displayName?.trim()) await updateProfile(credential.user, { displayName: displayName.trim() });
  return credential;
}

export const logoutFromFirebase = () => signOut(firebaseAuth);
export const sendResetEmail = (email: string) => sendPasswordResetEmail(firebaseAuth, email.trim());
