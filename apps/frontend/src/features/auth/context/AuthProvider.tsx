import React, { createContext, useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User, AuthContextValue, BuyerRegistrationInput, DealerApplicationInput } from '../types/auth.types';
import { authApi } from '../services/authApi';
import { firebaseAuth } from '../services/firebaseAuth';
import { getMyDealerApplication, submitDealerApplication } from '../../dealers/services/dealerApi';
import { toDealerApplicationPayload } from '../../dealers/utils/applicationPayload';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);


async function loadUserWithDealerStatus(): Promise<User> {
  const currentUser = await authApi.getCurrentUser();
  if (currentUser.role === 'buyer') {
    try {
      const application = await getMyDealerApplication();
      currentUser.dealerStatus = application.status;
      currentUser.businessName = application.businessName;
    } catch { /* A normal buyer has no dealer application. */ }
  }
  return currentUser;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const signedInUserId = useRef<string | null>(null);

  // Cached API data (uploads, listings, notifications...) belongs to one account. Drop it whenever
  // the signed-in account changes, including sign-out, so the next person on this browser never
  // sees the previous user's data, even briefly.
  const switchAccount = (next: User | null) => {
    const nextId = next?.id ?? null;
    if (nextId !== signedInUserId.current) queryClient.clear();
    signedInUserId.current = nextId;
    setUser(next);
  };

  useEffect(() => firebaseAuth.onAuthStateChanged(async (isSignedIn) => {
    if (!isSignedIn) {
      switchAccount(null);
      setIsLoading(false);
      return;
    }

    try {
      switchAccount(await loadUserWithDealerStatus());
    } catch {
      switchAccount(null);
    } finally {
      setIsLoading(false);
    }
  }), []);

  const login = async (email: string, password: string) => {
    await firebaseAuth.signInWithEmail(email, password);
    try {
      const currentUser = await loadUserWithDealerStatus();
      switchAccount(currentUser);
      return currentUser;
    } catch (error) {
      await firebaseAuth.signOut().catch(() => undefined);
      switchAccount(null);
      throw error;
    }
  };

  const registerBuyer = async (data: BuyerRegistrationInput) => {
    await firebaseAuth.registerWithEmail(data.email, data.password, data.fullName);
    await authApi.getCurrentUser();
    switchAccount(await authApi.updateProfile(data.fullName, data.phone));
  };

  const registerDealerApplication = async (data: DealerApplicationInput) => {
    await firebaseAuth.registerWithEmail(data.email, data.password, data.applicantName);
    let applicationSubmitted = false;
    try {
      await authApi.getCurrentUser();
      await authApi.updateProfile(data.applicantName, data.phone);
      const application = await submitDealerApplication(toDealerApplicationPayload(data), {
        businessRegistration: data.businessRegistration,
        identityProof: data.identityProof,
        additionalDocument: data.additionalDocument,
      });
      applicationSubmitted = true;
      await firebaseAuth.signOut();
      switchAccount(null);
      return application;
    } catch (error) {
      if (!applicationSubmitted) await firebaseAuth.deleteCurrentUser().catch(() => undefined);
      switchAccount(null);
      throw error;
    }
  };

  const logout = async () => {
    await firebaseAuth.signOut();
    switchAccount(null);
  };

  // Reloads the signed-in user (e.g. after submitting a dealer application from an existing account).
  const refreshUser = async () => {
    const currentUser = await loadUserWithDealerStatus();
    switchAccount(currentUser);
    return currentUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerBuyer,
        registerDealerApplication,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
