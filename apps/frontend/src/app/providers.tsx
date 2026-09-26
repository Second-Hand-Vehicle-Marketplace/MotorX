import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../shared/services/queryClient';
import { AuthProvider } from '../features/auth/context/AuthProvider';
import { ThemeProvider } from './theme/ThemeProvider';
import { ThemeToggle } from './theme/ThemeToggle';
import { I18nProvider } from '../shared/i18n/I18nProvider';
import { CompareProvider } from '../features/compare/CompareProvider';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CompareProvider>
              {children}
              <ThemeToggle />
            </CompareProvider>
          </AuthProvider>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  );
};