import { test, expect, type Page } from '@playwright/test';

// Public buyer journeys. They only read data, so they are safe to run against the live site.

// On phones the filters live in a sheet behind a "Filters" button; on desktop they are always shown.
async function openFiltersOnPhone(page: Page) {
  await expect(page.getByText(/Showing \d+ of \d+ vehicles/)).toBeVisible();
  const filters = page.getByRole('button', { name: /^Filters/ });
  if (await filters.isVisible()) await filters.click();
  await expect(page.getByLabel('Fuel Type')).toBeVisible();
}

test('search in plain words from the home page', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder(/automatic SUV under 8 million/).fill('economical hybrid for city driving');
  await page.getByRole('button', { name: 'Search Inventory' }).click();
  await expect(page).toHaveURL(/\/marketplace\?q=/);
  await expect(page.getByText(/Showing \d+ of \d+ vehicles/)).toBeVisible();
});

test('filter the marketplace and open a vehicle', async ({ page }) => {
  await page.goto('/marketplace');
  await openFiltersOnPhone(page);
  await page.getByLabel('Fuel Type').selectOption('hybrid');
  await page.keyboard.press('Escape');
  // Wait until the list has refreshed with the filter applied before opening a card.
  const firstCard = page.locator('a.listing-card-link').first();
  await expect(firstCard).toContainText('Hybrid');
  await firstCard.getByRole('heading').click();
  await expect(page).toHaveURL(/\/marketplace\/[a-f\d]{24}$/);
  // On a phone-sized, high-density screen the cards fetch full-size photos, which can delay the
  // vehicle request on a slow connection, so this step gets extra time.
  await expect(page.getByText('Vehicle Specifications')).toBeVisible({ timeout: 40_000 });
  await expect(page.getByText('Hybrid').first()).toBeVisible();
});

test('compare two vehicles side by side', async ({ page }) => {
  await page.goto('/marketplace');
  // A chosen card's button turns into "Remove … from comparison", so take the first "Add" each time.
  const addButtons = page.getByRole('button', { name: /^Add .* to comparison$/ });
  await addButtons.first().click();
  await addButtons.first().click();
  await expect(page.getByRole('button', { name: /^Remove .* from comparison$/ })).toHaveCount(2);
  // The tray slides up when the first vehicle is added; click once it has settled.
  const compareNow = page.getByRole('link', { name: 'Compare now' });
  await expect(compareNow).toBeVisible();
  await page.waitForTimeout(500);
  await compareNow.click();
  await expect(page).toHaveURL(/\/compare\?ids=/);
  await expect(page.getByRole('heading', { name: 'Compare Vehicles' })).toBeVisible();
});

test('dealer and admin areas need sign-in', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).not.toHaveURL(/\/admin$/);
  await page.goto('/dealer');
  await expect(page).not.toHaveURL(/\/dealer$/);
});
