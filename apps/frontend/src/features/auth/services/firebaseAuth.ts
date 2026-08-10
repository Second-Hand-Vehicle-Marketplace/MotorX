export const firebaseAuth = {
  getIdToken: async () => 'mock-firebase-id-token',
  signInWithEmail: async () => ({ user: { uid: 'mock_uid_123' } }),
  signOut: async () => undefined,
};