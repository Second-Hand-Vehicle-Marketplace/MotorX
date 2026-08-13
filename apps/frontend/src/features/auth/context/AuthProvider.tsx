import React, { createContext, useEffect, useState } from 'react';
import type { User, AuthContextValue, DealerApplicationInput } from '../types/auth.types';
import { authApi } from '../services/authApi';
import { createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { firebaseAuth } from '../../../config/firebase';
import {
  approveDealerApplication,
  findDealerApplicationByEmail,
  findDealerApplicationById,
  registerDealerApplication as persistDealerApplication,
} from '../services/dealerApplications';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      void authApi.getCurrentUser()
        .then(setUser)
        .catch(async () => {
          await signOut(firebaseAuth);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    });
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      const currentUser = await authApi.login(email, String(password ?? ''));
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      const normalizedEmail = email.toLowerCase();
      const application = await findDealerApplicationByEmail(normalizedEmail);

      if (application) {
        if (application.status === 'pending') {
          throw new Error('Registration submitted. An administrator must approve your dealership application before you can sign in.');
        }

        if (application.status === 'rejected') {
          throw new Error('Your dealership application was rejected. Please contact support or resubmit with corrected details.');
        }
      }

      throw error;
    }
  };

  const registerDealerApplication = async (data: DealerApplicationInput) => {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, data.email, data.password);
    const idToken = await credential.user.getIdToken();
    const application = await persistDealerApplication({
      ...data,
      idToken,
    });
    await signOut(firebaseAuth);
    return application;
  };

  const logout = () => {
    setUser(null);
    void signOut(firebaseAuth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerDealerApplication,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};