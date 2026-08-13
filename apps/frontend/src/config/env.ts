export const env = {
  API_URL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1',
  IS_MOCK: false,
} as const;