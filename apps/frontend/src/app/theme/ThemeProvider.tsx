import React, { createContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const storageKey = 'motorx_theme_mode';

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const stored = window.localStorage.getItem(storageKey) as ThemeMode | null;
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    window.localStorage.setItem(storageKey, theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    toggleTheme: () => setThemeState(current => current === 'dark' ? 'light' : 'dark'),
    setTheme: setThemeState,
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};