import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../shared/services/queryClient';
import { AuthProvider } from '../features/auth/context/AuthProvider';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};