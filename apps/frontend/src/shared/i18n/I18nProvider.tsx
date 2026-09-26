import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { readStored, writeStored } from '../utils/safeStorage';
import { en, type MessageKey, type Messages } from './messages/en';
import { si } from './messages/si';
import { ta } from './messages/ta';

export const languages = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
] as const;
export type Language = (typeof languages)[number]['code'];

const dictionaries: Record<Language, Messages> = { en, si, ta };
const STORAGE_KEY = 'motorx.language';
const isLanguage = (value: unknown): value is Language => languages.some((language) => language.code === value);

export type TranslateValues = Record<string, string | number>;
export interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: MessageKey, values?: TranslateValues) => string;
  // Label for a vehicle enum value (fuel type, body type...), falling back to a readable form.
  tEnum: (value: string | undefined) => string;
}

function interpolate(text: string, values?: TranslateValues) {
  return values ? text.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match)) : text;
}

export function readableEnum(value: string | undefined) {
  return value ? value.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '—';
}

export function createTranslator(language: Language): Pick<I18nContextValue, 't' | 'tEnum'> {
  const messages = dictionaries[language];
  return {
    t: (key, values) => interpolate(messages[key] ?? en[key], values),
    tEnum: (value) => {
      if (!value) return '—';
      const key = `enum.${value}` as MessageKey;
      return key in messages ? messages[key] : readableEnum(value);
    },
  };
}

// First visit: the browser's preferred language when it is Sinhala or Tamil, otherwise English.
function initialLanguage(): Language {
  const stored = readStored<Language | null>(STORAGE_KEY, null, (value): value is Language => isLanguage(value));
  if (stored) return stored;
  const preferred = typeof navigator === 'undefined' ? '' : navigator.language.toLowerCase();
  return preferred.startsWith('si') ? 'si' : preferred.startsWith('ta') ? 'ta' : 'en';
}

// Components used without a provider (e.g. in isolated tests) get English.
export const I18nContext = createContext<I18nContextValue>({ language: 'en', setLanguage: () => undefined, ...createTranslator('en') });

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const setLanguage = useCallback((next: Language) => { setLanguageState(next); writeStored(STORAGE_KEY, next); }, []);

  // Screen readers, spell checkers and the Sinhala/Tamil fonts rely on the page's lang attribute.
  useEffect(() => { document.documentElement.lang = language; }, [language]);

  const value = useMemo(() => ({ language, setLanguage, ...createTranslator(language) }), [language, setLanguage]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
