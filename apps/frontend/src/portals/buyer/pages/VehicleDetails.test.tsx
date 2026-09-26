import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const buyerApi = vi.hoisted(() => ({ getVehicle: vi.fn(), getSimilarVehicles: vi.fn(), getRecommendedVehicles: vi.fn() }));
vi.mock('@/features/buyers/services/buyerApi', () => ({ buyerApi }));

import { VehicleDetails } from './VehicleDetails';

const listingId = 'a'.repeat(24);
const listing = {
  id: listingId, dealerId: 'd', registrationNumber: 'CAX-1', title: 'Toyota Aqua 2018', make: 'Toyota', model: 'Aqua', year: 2018, price: 6_000_000, currency: 'LKR', location: 'Colombo',
  description: 'Clean car.', status: 'active', publishedAt: '2026-09-01T00:00:00Z', lastConfirmedAt: '2026-09-20T00:00:00Z', category: 'car',
  images: [1, 2, 3].map((n) => ({ id: `k${n}`, url: `https://img/${n}.webp`, thumbUrl: `https://img/thumbs/${n}.webp`, alt: `Photo ${n}`, isPrimary: n === 1 })),
  attributes: { bodyType: 'hatchback', condition: 'used', mileageKm: 60_000, fuelType: 'hybrid', transmission: 'automatic', engineCapacityCc: 1500 },
  dealer: { businessName: 'Lanka Motors', location: 'Colombo, Western', phone: '077 123 4567', email: 'sales@lankamotors.lk', description: '', website: null },
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[`/marketplace/${listingId}`]}><Routes><Route path="/marketplace/:listingId" element={<VehicleDetails />} /></Routes></MemoryRouter></QueryClientProvider>);
}

describe('vehicle page', () => {
  beforeEach(() => {
    window.localStorage.clear(); vi.clearAllMocks();
    buyerApi.getVehicle.mockResolvedValue(listing);
    buyerApi.getSimilarVehicles.mockResolvedValue([]);
  });

  it('keeps Call, WhatsApp and Email one tap away, with the WhatsApp message ready', async () => {
    renderPage();
    const bar = await screen.findByRole('navigation', { name: 'Contact the dealer' });
    expect(within(bar).getByRole('link', { name: /Call/ })).toHaveAttribute('href', 'tel:077 123 4567');
    expect(within(bar).getByRole('link', { name: /WhatsApp/ }).getAttribute('href')).toMatch(/^https:\/\/wa\.me\/94771234567\?text=.*Toyota%20Aqua%202018/);
    expect(document.body).toHaveClass('has-contact-bar');
  });

  it('loads the small photo copy on phones, and lets the buyer swipe or tap through photos', async () => {
    renderPage();
    const gallery = await screen.findByRole('region', { name: 'Toyota Aqua 2018' });
    const photo = within(gallery).getByRole('img');
    expect(photo).toHaveAttribute('srcset', 'https://img/thumbs/1.webp 800w, https://img/1.webp 2560w');
    expect(within(gallery).getByText('Photo 1 of 3')).toBeInTheDocument();

    fireEvent.touchStart(gallery, { touches: [{ clientX: 300, clientY: 100 }] });
    fireEvent.touchEnd(gallery, { changedTouches: [{ clientX: 150, clientY: 110 }] });
    expect(within(gallery).getByText('Photo 2 of 3')).toBeInTheDocument();

    await userEvent.click(within(gallery).getByRole('button', { name: 'Previous photo' }));
    await userEvent.click(within(gallery).getByRole('button', { name: 'Previous photo' }));
    expect(within(gallery).getByText('Photo 3 of 3')).toBeInTheDocument();
  });

  it('ignores a mostly vertical finger movement (the page scrolling)', async () => {
    renderPage();
    const gallery = await screen.findByRole('region', { name: 'Toyota Aqua 2018' });
    fireEvent.touchStart(gallery, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(gallery, { changedTouches: [{ clientX: 150, clientY: 300 }] });
    expect(within(gallery).getByText('Photo 1 of 3')).toBeInTheDocument();
  });

  it('remembers the vehicle on this device for recommendations, and shows similar vehicles', async () => {
    buyerApi.getSimilarVehicles.mockResolvedValue([{ ...listing, id: 'b'.repeat(24), title: 'Toyota Aqua 2017' }]);
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Similar vehicles' })).toBeInTheDocument();
    expect(screen.getByText('Toyota Aqua 2017')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('motorx.recentlyViewed')!)).toEqual([listingId]);
  });
});
