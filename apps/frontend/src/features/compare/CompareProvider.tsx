import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { isStringArray, readStored, writeStored } from '@/shared/utils/safeStorage';

export const MAX_COMPARE = 3;
const STORAGE_KEY = 'motorx.compare';

interface CompareContextValue {
  ids: string[];
  has: (id: string) => boolean;
  // Returns false (and changes nothing) when the list is already full.
  toggle: (id: string) => boolean;
  remove: (id: string) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue | undefined>(undefined);

// The vehicles a buyer has picked to compare. Kept in this browser only, so the list survives page
// changes and reloads without an account.
export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ids, setIds] = useState<string[]>(() => readStored(STORAGE_KEY, [], isStringArray).slice(0, MAX_COMPARE));

  const save = useCallback((next: string[]) => { setIds(next); writeStored(STORAGE_KEY, next); }, []);

  const value = useMemo<CompareContextValue>(() => ({
    ids,
    has: (id) => ids.includes(id),
    toggle: (id) => {
      if (ids.includes(id)) { save(ids.filter((item) => item !== id)); return true; }
      if (ids.length >= MAX_COMPARE) return false;
      save([...ids, id]);
      return true;
    },
    remove: (id) => save(ids.filter((item) => item !== id)),
    clear: () => save([]),
  }), [ids, save]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
};

const noCompare: CompareContextValue = { ids: [], has: () => false, toggle: () => false, remove: () => undefined, clear: () => undefined };

// Outside a provider (isolated component tests) comparing is simply unavailable.
export function useCompare() {
  return useContext(CompareContext) ?? noCompare;
}
