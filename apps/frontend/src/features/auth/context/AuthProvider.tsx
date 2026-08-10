import React, { createContext, useState, useEffect } from 'react';
import type { User, UserRole, AuthContextValue } from '../types/auth.types';
import { mockUsers } from '../../../shared/mockData';

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
    const found = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setUser(found);
      localStorage.setItem('motorx_demo_role', found.role);
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
    }
  };

  const loginAsRole = (role: UserRole) => {
    const targetUser = mockUsers.find(u => u.role === role) || {
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
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('motorx_demo_role');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: false,
        login,
        loginAsRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};