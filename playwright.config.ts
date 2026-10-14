import { defineConfig, devices } from '@playwright/test';

// Browser end-to-end tests. Run against the live site by default, or a local stack with
// E2E_BASE_URL=http://localhost:4173. Sign-in uses test accounts from environment variables
// (E2E_DEALER_EMAIL / E2E_DEALER_PASSWORD, E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD).
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  // Pages such as vehicle details and compare load their code on first visit; over the internet
  // to the live server that can take longer than the 5 s default.
  expect: { timeout: 15_000 },
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://motorx.duckdns.org',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
    // The buyer journeys again on a phone-sized screen, to cover the responsive layout.
    { name: 'phone', use: { ...devices['Pixel 7'] }, dependencies: ['setup'], testMatch: /buyer\.spec\.ts/ },
  ],
});
