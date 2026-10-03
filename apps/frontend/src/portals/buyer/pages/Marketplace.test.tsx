import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const buyerApi = vi.hoisted(() => ({ listVehicles: vi.fn(), searchVehicles: vi.fn(), getRecommendedVehicles: vi.fn() }));
vi.mock('@/features/buyers/services/buyerApi', () => ({ buyerApi }));

import { CompareProvider } from '@/features/compare/CompareProvider';
import { Marketplace } from './Marketplace';

const car = (n: number, overrides = {}) => ({
  id: `car-${n}`, dealerId: 'd', registrationNumber: `R${n}`, title: `Car ${n}`, make: 'Toyota', model: 'Aqua', year: 2018, price: 6_000_000, currency: 'LKR', location: 'Colombo',
  description: '', images: [], status: 'active', publishedAt: null, category: 'car',
  attributes: { bodyType: 'hatchback', condition: 'used', mileageKm: 60_000, fuelType: 'hybrid', transmission: 'automatic', engineCapacityCc: 1500 }, ...overrides,
});
const results = (cars: unknown[], total = cars.length, totalPages = 1) => ({ data: cars, total, page: 1, pageSize: 9, totalPages });

function renderMarketplace(path = '/marketplace') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><CompareProvider><MemoryRouter initialEntries={[path]}><Routes><Route path="/marketplace" element={<Marketplace />} /></Routes></MemoryRouter></CompareProvider></QueryClientProvider>);
}

describe('buyer marketplace', () => {
  beforeEach(() => { vi.clearAllMocks(); buyerApi.getRecommendedVehicles.mockResolvedValue([]); });

  it('lists vehicles and filters them, counting the active filters', async () => {
    buyerApi.listVehicles.mockResolvedValue(results([car(1), car(2)]));
    renderMarketplace();
    expect(await screen.findByText('Car 1')).toBeInTheDocument();
    expect(screen.getByText('Showing 2 of 2 vehicles')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Make'), 'Toyota');
    await userEvent.selectOptions(screen.getByLabelText('Fuel Type'), 'hybrid');
    await userEvent.type(screen.getByLabelText('Location'), 'Kandy');
    await userEvent.type(screen.getByLabelText('Minimum year'), '2015');
    await waitFor(() => expect(buyerApi.listVehicles).toHaveBeenLastCalledWith(expect.objectContaining({ make: 'Toyota', fuelType: 'hybrid', location: 'Kandy', yearMin: 2015 }), 1, 9));
    expect(screen.getByRole('button', { name: 'Filters (4)' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reset All' }));
    await waitFor(() => expect(buyerApi.listVehicles).toHaveBeenLastCalledWith({}, 1, 9));
  });

  it('searches in everyday language after the buyer stops typing, sorted by relevance', async () => {
    buyerApi.listVehicles.mockResolvedValue(results([car(1)]));
    buyerApi.searchVehicles.mockResolvedValue(results([car(3, { title: 'Automatic SUV' })]));
    renderMarketplace();
    await screen.findByText('Car 1');
    await userEvent.type(screen.getByRole('searchbox', { name: /search/i }), 'automatic suv under 8m');

    expect(await screen.findByText('Automatic SUV')).toBeInTheDocument();
    expect(buyerApi.searchVehicles).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'automatic suv under 8m', sortBy: 'relevance' }), 1, 9);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /sort/i }), 'price-asc');
    await waitFor(() => expect(buyerApi.searchVehicles).toHaveBeenLastCalledWith(expect.objectContaining({ sortBy: 'price-asc' }), 1, 9));
  });

  it('starts from a search in the address, e.g. from the home page', async () => {
    buyerApi.searchVehicles.mockResolvedValue(results([car(4)]));
    renderMarketplace('/marketplace?q=hybrid%20car');
    expect(await screen.findByText('Car 4')).toBeInTheDocument();
    expect(buyerApi.searchVehicles).toHaveBeenCalledWith(expect.objectContaining({ q: 'hybrid car', sortBy: 'relevance' }), 1, 9);
    expect(screen.getByRole('searchbox', { name: /search/i })).toHaveValue('hybrid car');
  });

  it('pages through long result lists', async () => {
    buyerApi.listVehicles.mockResolvedValue(results([car(1)], 30, 4));
    renderMarketplace();
    await screen.findByText('Car 1');
    const pager = screen.getByRole('navigation', { name: 'Search result pages' });
    expect(within(pager).getByRole('button', { name: 'Previous result page' })).toBeDisabled();
    await userEvent.click(within(pager).getByRole('button', { name: 'Next result page' }));
    await waitFor(() => expect(buyerApi.listVehicles).toHaveBeenLastCalledWith({}, 2, 9));
    await userEvent.click(within(pager).getByRole('button', { name: 'Result page 4' }));
    await waitFor(() => expect(buyerApi.listVehicles).toHaveBeenLastCalledWith({}, 4, 9));
    await userEvent.click(within(pager).getByRole('button', { name: 'Previous result page' }));
    await waitFor(() => expect(buyerApi.listVehicles).toHaveBeenLastCalledWith({}, 3, 9));
  });

  it('shows an empty result with a way out, and an error with a retry', async () => {
    buyerApi.listVehicles.mockResolvedValueOnce(results([]));
    renderMarketplace();
    expect(await screen.findByText('No Vehicles Found')).toBeInTheDocument();
    buyerApi.listVehicles.mockRejectedValue(new Error('down'));
    await userEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));
    await userEvent.selectOptions(screen.getByLabelText('Make'), 'Honda');
    expect(await screen.findByText('Could not load marketplace listings.')).toBeInTheDocument();
    buyerApi.listVehicles.mockResolvedValue(results([car(5)]));
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Car 5')).toBeInTheDocument();
  });

  it('opens the filter sheet on small screens and closes it with Escape, returning focus', async () => {
    buyerApi.listVehicles.mockResolvedValue(results([car(1)]));
    renderMarketplace();
    await screen.findByText('Car 1');
    const button = screen.getByRole('button', { name: 'Filters' });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(document.body.style.overflow).toBe('hidden');
    await userEvent.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();

    await userEvent.click(button);
    await userEvent.click(screen.getByRole('button', { name: 'Show 1 vehicles' }));
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
