import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listingApi = vi.hoisted(() => ({ getMyListings: vi.fn(), getMyListingStats: vi.fn(), bulkAction: vi.fn() }));
vi.mock('@/features/listings/services/listingApi', () => ({ listingApi }));

import { describeBulkResult, ListingManager } from './ListingManager';

const DAY_MS = 24 * 60 * 60 * 1000;
const listing = (n: number, overrides = {}) => ({
  id: `listing-${n}`, dealerId: 'd', registrationNumber: `R${n}`, title: `Car ${n}`, make: 'Toyota', model: 'Aqua', year: 2018, price: 6_000_000, currency: 'LKR', location: 'Colombo',
  description: '', images: [], status: 'draft', publishedAt: null, lastConfirmedAt: null, category: 'car',
  attributes: { bodyType: 'hatchback', condition: 'used', mileageKm: 60_000, fuelType: 'hybrid', transmission: 'automatic', engineCapacityCc: 1500 }, ...overrides,
});
const page = (data: unknown[]) => ({ data, total: data.length, page: 1, pageSize: 20, totalPages: 1 });

function renderAt(path = '/dealer/listings') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[path]}><Routes><Route path="/dealer/listings" element={<ListingManager />} /></Routes></MemoryRouter></QueryClientProvider>);
}

describe('dealer listing manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listingApi.getMyListingStats.mockResolvedValue({ total: 5, active: 3, draft: 2, sold: 0, archived: 1, stale: 2, staleAfterDays: 60 });
    listingApi.bulkAction.mockResolvedValue({ action: 'publish', matched: 2, updated: 2, skipped: 0 });
  });

  it('reminds the dealer about stale stock and opens the stale list', async () => {
    listingApi.getMyListings.mockResolvedValue(page([]));
    renderAt();

    expect(await screen.findByText("2 listings haven't been updated in 60 days.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Review now' }));

    expect(listingApi.getMyListings).toHaveBeenLastCalledWith(1, 20, expect.objectContaining({ stale: true }));
    expect(screen.getByRole('tab', { name: 'Needs attention (2)' })).toHaveAttribute('aria-selected', 'true');
  });

  it('publishes every selected draft in one request', async () => {
    listingApi.getMyListings.mockResolvedValue(page([listing(1), listing(2)]));
    renderAt();

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Select all listings on this page' }));
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('region', { name: 'Bulk actions' })).getByRole('button', { name: 'Publish' }));

    expect(listingApi.bulkAction).toHaveBeenCalledWith({ action: 'publish', listingIds: ['listing-1', 'listing-2'] });
    expect(await screen.findByText('2 listings published.')).toBeInTheDocument();
    expect(screen.queryByText('2 selected')).not.toBeInTheDocument();
  });

  it('offers one-click fixes on stale listings and shows how long ago each was confirmed', async () => {
    const old = new Date(Date.now() - 75 * DAY_MS).toISOString();
    listingApi.getMyListings.mockResolvedValue(page([listing(1, { status: 'active', lastConfirmedAt: old })]));
    listingApi.bulkAction.mockResolvedValue({ action: 'confirm-available', matched: 1, updated: 1, skipped: 0 });
    renderAt('/dealer/listings?view=stale');

    expect(await screen.findByText('75 days ago')).toHaveClass('stale-age');
    await userEvent.click(screen.getByRole('button', { name: 'Still available' }));

    expect(listingApi.bulkAction).toHaveBeenCalledWith({ action: 'confirm-available', listingIds: ['listing-1'] });
    expect(await screen.findByText('1 listing confirmed as still available.')).toBeInTheDocument();
  });

  it('previews a price cut before applying it', async () => {
    listingApi.getMyListings.mockResolvedValue(page([listing(1, { status: 'active', lastConfirmedAt: new Date(Date.now() - 90 * DAY_MS).toISOString() })]));
    listingApi.bulkAction.mockResolvedValue({ action: 'reduce-price', matched: 1, updated: 1, skipped: 0 });
    renderAt('/dealer/listings?view=stale');

    await userEvent.click(await screen.findByRole('button', { name: 'Reduce price' }));
    const dialog = screen.getByRole('dialog', { name: 'Reduce price' });
    await userEvent.click(within(dialog).getByRole('button', { name: '10%' }));
    expect(within(dialog).getByText(/5,400,000/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reduce by 10%' }));

    expect(listingApi.bulkAction).toHaveBeenCalledWith({ action: 'reduce-price', listingIds: ['listing-1'], percent: 10 });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('explains skipped listings in plain words', () => {
    expect(describeBulkResult({ action: 'mark-sold', matched: 5, updated: 3, skipped: 2 })).toBe('3 listings marked sold. 2 skipped because the action does not apply to their current status.');
  });
});
