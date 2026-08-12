import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { firebaseAuth } from '../../../config/firebase';
import { getCurrentLocalUser } from '../services/authApi';
import { loginWithEmail, logoutFromFirebase, registerWithEmail, sendResetEmail } from '../services/firebaseAuth';
import type { AuthContextValue, LocalUser } from '../types/auth.types';

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(firebaseAuth, async (user) => {
    setFirebaseUser(user);
    try {
      setLocalUser(user ? await getCurrentLocalUser() : null);
    } catch {
      setLocalUser(null);
      if (user) await logoutFromFirebase();
    } finally {
      setLoading(false);
    }
  }), []);

  const value = useMemo<AuthContextValue>(() => ({
    firebaseUser,
    localUser,
    loading,
    login: async (email, password) => {
      setLoading(true);
      try { await loginWithEmail(email, password); } catch (error) { setLoading(false); throw error; }
    },
    register: async (email, password, displayName) => {
      setLoading(true);
      try { await registerWithEmail(email, password, displayName); } catch (error) { setLoading(false); throw error; }
    },
    logout: logoutFromFirebase,
    resetPassword: sendResetEmail,
  }), [firebaseUser, localUser, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
