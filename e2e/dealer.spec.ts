import { existsSync } from 'node:fs';
import { test, expect } from '@playwright/test';

// Read-only dealer journeys, using the session saved by auth.setup.ts.
const session = 'e2e/.auth/dealer.json';
test.skip(!existsSync(session) && !process.env.E2E_DEALER_EMAIL, 'Dealer credentials not set');
test.use({ storageState: session });

test('dealer dashboard and inventory load', async ({ page }) => {
  await page.goto('/dealer');
  await expect(page.getByRole('heading', { name: 'Dealer Dashboard' })).toBeVisible();
  await page.goto('/dealer/listings');
  await expect(page.getByRole('heading', { name: 'Manage Inventory' })).toBeVisible();
});

test('dealer can download a CSV template', async ({ page }) => {
  await page.goto('/dealer/uploads/new');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download .* CSV Template/ }).click();
  expect((await download).suggestedFilename()).toMatch(/^motorx-.*-template\.csv$/);
});

// The role guard keeps the address but replaces the page with an "Access Restricted" message.
test('dealer is kept out of the admin portal', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Access Restricted' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Needs attention' })).toHaveCount(0);
});
