export const env = {
  API_URL: (import.meta as any).env?.VITE_API_URL || '/api/v1',
  IS_MOCK: true,
} as const;