import React, { createContext, useState, useEffect } from 'react';
import type { User, AuthContextValue, BuyerRegistrationInput, DealerApplicationInput } from '../types/auth.types';
import { authApi } from '../services/authApi';
import { firebaseAuth } from '../services/firebaseAuth';
import { getMyDealerApplication, submitDealerApplication } from '../../dealers/services/dealerApi';

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

  useEffect(() => firebaseAuth.onAuthStateChanged(async (isSignedIn) => {
    if (!isSignedIn) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setUser(await loadUserWithDealerStatus());
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }), []);

  const login = async (email: string, password: string) => {
    await firebaseAuth.signInWithEmail(email, password);
    try {
      const currentUser = await loadUserWithDealerStatus();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      await firebaseAuth.signOut().catch(() => undefined);
      setUser(null);
      throw error;
    }
  };

  const registerBuyer = async (data: BuyerRegistrationInput) => {
    await firebaseAuth.registerWithEmail(data.email, data.password, data.fullName);
    await authApi.getCurrentUser();
    setUser(await authApi.updateProfile(data.fullName, data.phone));
  };

  const registerDealerApplication = async (data: DealerApplicationInput) => {
    await firebaseAuth.registerWithEmail(data.email, data.password, data.applicantName);
    let applicationSubmitted = false;
    try {
      await authApi.getCurrentUser();
      await authApi.updateProfile(data.applicantName, data.phone);
      const application = await submitDealerApplication({
        representativeName: data.applicantName,
        businessName: data.businessName,
        registrationNumber: data.businessLicense,
        phone: data.phone,
        address: data.address,
        city: data.city ?? '',
        province: data.province ?? '',
        businessPhone: data.businessContact ?? data.phone,
        businessEmail: data.businessEmail ?? data.email,
        website: data.website || undefined,
        dealershipType: data.dealershipType ?? 'both',
        brands: data.brandFocus ? data.brandFocus.split(',').map((brand) => brand.trim()).filter(Boolean) : [],
        description: data.businessDescription ?? '',
        inventoryCount: data.inventoryCount ? Number(data.inventoryCount) : undefined,
      }, {
        businessRegistration: data.businessRegistration,
        identityProof: data.identityProof,
        additionalDocument: data.additionalDocument,
      });
      applicationSubmitted = true;
      await firebaseAuth.signOut();
      setUser(null);
      return application;
    } catch (error) {
      if (!applicationSubmitted) await firebaseAuth.deleteCurrentUser().catch(() => undefined);
      setUser(null);
      throw error;
    }
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
        registerBuyer,
        registerDealerApplication,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
