import { createUserWithEmailAndPassword, deleteUser, onAuthStateChanged, onIdTokenChanged, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile, type User } from 'firebase/auth';
import { firebaseAuthClient } from '../../../config/firebase';

export const firebaseAuth = {
  signInWithEmail: (email: string, password: string) =>
    signInWithEmailAndPassword(firebaseAuthClient, email, password),

  registerWithEmail: async (email: string, password: string, displayName: string) => {
    const credential = await createUserWithEmailAndPassword(firebaseAuthClient, email, password);
    await updateProfile(credential.user, { displayName });
    // Proves the address belongs to the user. Registration still succeeds if sending fails;
    // the verification banner offers a resend.
    await sendEmailVerification(credential.user).catch(() => undefined);
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

  resendEmailVerification: async () => {
    if (firebaseAuthClient.currentUser) await sendEmailVerification(firebaseAuthClient.currentUser);
  },

  // Reloads the account after the user clicked the link in the email, and refreshes the ID token so
  // the backend sees the new email_verified claim. Returns whether the email is now verified.
  refreshEmailVerification: async () => {
    const user = firebaseAuthClient.currentUser;
    if (!user) return false;
    await user.reload();
    await user.getIdToken(true);
    return user.emailVerified;
  },

  onUserChanged: (callback: (user: User | null) => void) => onIdTokenChanged(firebaseAuthClient, callback),

  onAuthStateChanged: (callback: (isSignedIn: boolean) => void) =>
    onAuthStateChanged(firebaseAuthClient, (user) => callback(Boolean(user))),
};
