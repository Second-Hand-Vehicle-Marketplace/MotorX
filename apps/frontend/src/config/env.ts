export const env = {
  API_URL:
    import.meta.env.VITE_API_BASE_URL ??
    'http://localhost:3000/api/v1',
  IS_MOCK: false,
} as const;