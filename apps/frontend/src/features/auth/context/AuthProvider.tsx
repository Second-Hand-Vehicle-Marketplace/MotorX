import React, { createContext, useState, useEffect } from 'react';
import type { User, UserRole, AuthContextValue, DealerApplicationInput } from '../types/auth.types';
import { mockUsers } from '../../../shared/mockData';
import {
  approveDealerApplication,
  findDealerApplicationByEmail,
  findDealerApplicationById,
  registerDealerApplication as persistDealerApplication,
} from '../services/dealerApplications';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to buyer user for instant preview, can switch roles freely in top bar/demo toggle
  const [user, setUser] = useState<User | null>(() => {
    const savedRole = localStorage.getItem('motorx_demo_role') as UserRole | null;
    if (savedRole) {
      return mockUsers.find(u => u.role === savedRole) || mockUsers[0];
    }
    return mockUsers[0]; // Default buyer user
  });

  const login = async (email: string) => {
    const normalizedEmail = email.toLowerCase();
    const application = findDealerApplicationByEmail(normalizedEmail);

    if (application) {
      if (application.status === 'pending') {
        throw new Error('Registration submitted. An administrator must approve your dealership application before you can sign in.');
      }

      if (application.status === 'rejected') {
        throw new Error('Your dealership application was rejected. Please contact support or resubmit with corrected details.');
      }

      const dealerUser: User = {
        id: `usr_${application.id}`,
        email: application.email,
        displayName: application.applicantName,
        role: 'dealer',
        dealerStatus: 'approved',
        businessName: application.businessName,
        businessLicense: application.businessLicense,
        phone: application.phone,
        address: application.address,
        createdAt: application.appliedAt,
        lastLoginAt: new Date().toISOString(),
        isActive: true,
      };

      setUser(dealerUser);
      localStorage.setItem('motorx_demo_role', 'dealer');
      localStorage.setItem('motorx_demo_user_email', dealerUser.email);
      return;
    }

    const found = mockUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (found) {
      setUser(found);
      localStorage.setItem('motorx_demo_role', found.role);
      localStorage.setItem('motorx_demo_user_email', found.email);
    } else {
      // Default to buyer with custom email
      const newUser: User = {
        id: `usr_${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        role: 'buyer',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: true,
      };
      setUser(newUser);
      localStorage.setItem('motorx_demo_role', 'buyer');
      localStorage.setItem('motorx_demo_user_email', newUser.email);
    }
  };

  const loginAsRole = (role: UserRole) => {
    const targetUser = role === 'dealer'
      ? mockUsers.find(u => u.role === 'dealer' && u.dealerStatus === 'approved') || {
        id: 'usr_demo_dealer',
        email: 'dealer@motorx.com',
        displayName: 'Premium Autos',
        role: 'dealer',
        dealerStatus: 'approved',
        businessName: 'Premium Autos',
        businessLicense: 'BL-DEMO-001',
        phone: '+1 (555) 123-4567',
        address: 'Demo Dealer Address',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: true,
      }
      : mockUsers.find(u => u.role === role) || {
      id: `usr_${role}`,
      email: `${role}@motorx.com`,
      displayName: `Demo ${role.toUpperCase()}`,
      role,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isActive: true,
    };
    setUser(targetUser);
    localStorage.setItem('motorx_demo_role', role);
    localStorage.setItem('motorx_demo_user_email', targetUser.email);
  };

  const registerDealerApplication = (data: DealerApplicationInput) => {
    const application = persistDealerApplication(data);
    return application;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('motorx_demo_role');
    localStorage.removeItem('motorx_demo_user_email');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: false,
        login,
        loginAsRole,
        registerDealerApplication,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};