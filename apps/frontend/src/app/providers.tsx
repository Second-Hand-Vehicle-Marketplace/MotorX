import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../shared/services/queryClient';
import { AuthProvider } from '../features/auth/context/AuthProvider';
import { ThemeProvider } from './theme/ThemeProvider';
import { ThemeToggle } from './theme/ThemeToggle';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <ThemeToggle />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};