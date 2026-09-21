import { createUserWithEmailAndPassword, deleteUser, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { firebaseAuthClient } from '../../../config/firebase';

export const firebaseAuth = {
  signInWithEmail: (email: string, password: string) =>
    signInWithEmailAndPassword(firebaseAuthClient, email, password),

  registerWithEmail: async (email: string, password: string, displayName: string) => {
    const credential = await createUserWithEmailAndPassword(firebaseAuthClient, email, password);
    await updateProfile(credential.user, { displayName });
    await credential.user.getIdToken(true);
    return credential;
  },

  getIdToken: async () =>
    firebaseAuthClient.currentUser?.getIdToken() ?? null,

  signOut: () => signOut(firebaseAuthClient),

  deleteCurrentUser: async () => {
    if (firebaseAuthClient.currentUser) await deleteUser(firebaseAuthClient.currentUser);
  },

  sendPasswordReset: (email: string) => sendPasswordResetEmail(firebaseAuthClient, email),

  onAuthStateChanged: (callback: (isSignedIn: boolean) => void) =>
    onAuthStateChanged(firebaseAuthClient, (user) => callback(Boolean(user))),
};
