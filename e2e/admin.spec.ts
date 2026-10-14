import { existsSync } from 'node:fs';
import { test, expect } from '@playwright/test';

// Read-only administrator journeys, using the session saved by auth.setup.ts.
const session = 'e2e/.auth/admin.json';
test.skip(!existsSync(session) && !process.env.E2E_ADMIN_EMAIL, 'Admin credentials not set');
test.use({ storageState: session });

const pages = [
  ['/admin', 'Admin Dashboard'],
  ['/admin/dealers', 'Dealer Applications'],
  ['/admin/users', 'User Accounts'],
  ['/admin/listings', 'Listings Oversight'],
  ['/admin/uploads', 'CSV Upload Monitoring'],
  ['/admin/audit-logs', 'Audit Logs'],
] as const;

for (const [path, heading] of pages) {
  test(`admin page ${path} loads`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  });
}
