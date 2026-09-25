import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

// Component tests run in a simulated browser (jsdom); API and Firebase calls are mocked per test.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    // Each jsdom worker is memory-hungry; more than two at once crashed on developer laptops.
    maxWorkers: 2,
  },
});
