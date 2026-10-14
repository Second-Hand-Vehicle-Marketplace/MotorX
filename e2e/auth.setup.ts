import { test as setup, expect } from '@playwright/test';

// Signs in once per role and saves the session (Firebase keeps it in IndexedDB) for the
// dealer and admin tests. Skipped when that role's credentials are not set.
const accounts = [
  { role: 'dealer', email: process.env.E2E_DEALER_EMAIL, password: process.env.E2E_DEALER_PASSWORD, landing: /\/dealer/ },
  { role: 'admin', email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD, landing: /\/admin/ },
];

for (const account of accounts.filter((a) => a.email && a.password)) {
  setup(`sign in as ${account.role}`, async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('name@example.com').fill(account.email!);
    await page.getByLabel(/^Password/).fill(account.password!);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(account.landing);
    await page.context().storageState({ path: `e2e/.auth/${account.role}.json`, indexedDB: true });
  });
}
