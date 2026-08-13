import React, { createContext, useState, useEffect } from 'react';
import type { User, AuthContextValue, DealerApplicationInput } from '../types/auth.types';
import { authApi } from '../services/authApi';
import { firebaseAuth } from '../services/firebaseAuth';
import { submitDealerApplication } from '../../dealers/services/dealerApi';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => firebaseAuth.onAuthStateChanged(async (isSignedIn) => {
    if (!isSignedIn) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setUser(await authApi.getCurrentUser());
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }), []);

  const login = async (email: string, password: string) => {
    await firebaseAuth.signInWithEmail(email, password);
    setUser(await authApi.getCurrentUser());
  };

  const registerDealerApplication = async (data: DealerApplicationInput) => {
    await firebaseAuth.registerWithEmail(data.email, data.password, data.applicantName);
    await authApi.getCurrentUser();
    const application = await submitDealerApplication({
      businessName: data.businessName,
      registrationNumber: data.businessLicense,
      phone: data.phone,
      address: data.address,
    });
    await firebaseAuth.signOut();
    setUser(null);
    return application;
  };

  const logout = async () => {
    await firebaseAuth.signOut();
    setUser(null);
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
