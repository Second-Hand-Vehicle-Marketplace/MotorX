// Browser storage for small per-device conveniences (language, compare list, recently viewed).
// Storage can be missing or throw (private windows, blocked site data), so every access is guarded
// and the app simply falls back to defaults.
export function readStored<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const value: unknown = JSON.parse(raw);
    return isValid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* not saved; the app still works */ }
}

export function removeStored(key: string) {
  try { window.localStorage.removeItem(key); } catch { /* nothing to remove */ }
}

export const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string');
