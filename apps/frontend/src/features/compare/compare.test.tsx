import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const buyerApi = vi.hoisted(() => ({ getVehicle: vi.fn() }));
vi.mock('@/features/buyers/services/buyerApi', () => ({ buyerApi }));

import { ComparePage, bestIndexes } from '@/portals/buyer/pages/ComparePage';
import { CompareProvider } from './CompareProvider';
import { CompareToggle } from './CompareToggle';
import { CompareTray } from './CompareTray';

const id = (n: number) => String(n).padStart(24, 'a');
const vehicle = (n: number, overrides = {}) => ({
  id: id(n), dealerId: 'd', registrationNumber: `R${n}`, title: `Car ${n}`, make: 'Toyota', model: 'Aqua', year: 2018, price: 6_000_000, currency: 'LKR', location: 'Colombo',
  description: '', images: [], status: 'active', publishedAt: null, category: 'car', dealer: { businessName: `Dealer ${n}`, location: '', phone: '', email: '', description: '' },
  attributes: { bodyType: 'hatchback', condition: 'used', mileageKm: 60_000, fuelType: 'hybrid', transmission: 'automatic', engineCapacityCc: 1500 }, ...overrides,
});

function renderWith(ui: React.ReactNode, path = '/marketplace') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CompareProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/marketplace" element={<>{ui}<CompareTray /></>} />
            <Route path="/compare" element={<ComparePage />} />
          </Routes>
        </MemoryRouter>
      </CompareProvider>
    </QueryClientProvider>,
  );
}

describe('compare vehicles', () => {
  beforeEach(() => { window.localStorage.clear(); vi.clearAllMocks(); });

  it('collects up to three vehicles, says when the list is full, and opens the comparison', async () => {
    renderWith(<>{[1, 2, 3, 4].map((n) => <CompareToggle key={n} listingId={id(n)} title={`Car ${n}`} />)}</>);

    for (const n of [1, 2, 3]) await userEvent.click(screen.getByRole('button', { name: `Add Car ${n} to comparison` }));
    expect(screen.getByText('3 of 3 vehicles selected')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add Car 4 to comparison' }));
    expect(screen.getByRole('status')).toHaveTextContent('You can compare up to 3 vehicles');

    await userEvent.click(screen.getByRole('button', { name: 'Remove Car 2 from comparison' }));
    expect(screen.getByText('2 of 3 vehicles selected')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Compare now' })).toHaveAttribute('href', `/compare?ids=${id(1)},${id(3)}`);
    expect(JSON.parse(window.localStorage.getItem('motorx.compare')!)).toEqual([id(1), id(3)]);
  });

  it('shows vehicles side by side and highlights the best price, year and mileage', async () => {
    buyerApi.getVehicle.mockImplementation(async (vehicleId: string) => vehicleId === id(1)
      ? vehicle(1, { price: 5_500_000, year: 2017 })
      : vehicle(2, { price: 6_500_000, year: 2019, attributes: { ...vehicle(2).attributes, mileageKm: 20_000 } }));
    renderWith(null, `/compare?ids=${id(1)},${id(2)}`);

    const priceRow = (await screen.findByRole('rowheader', { name: 'Price' })).closest('tr')!;
    const [cheaper] = within(priceRow).getAllByRole('cell');
    expect(cheaper).toHaveClass('compare-best');
    const yearCells = within(screen.getByRole('rowheader', { name: 'Year of Manufacture' }).closest('tr')!).getAllByRole('cell');
    expect(yearCells[1]).toHaveClass('compare-best');
    expect(within(screen.getByRole('rowheader', { name: 'Dealer' }).closest('tr')!).getByText('Dealer 2')).toBeInTheDocument();
  });

  it('says so when a vehicle is no longer available', async () => {
    buyerApi.getVehicle.mockImplementation(async (vehicleId: string) => { if (vehicleId === id(2)) throw new Error('not found'); return vehicle(1); });
    renderWith(null, `/compare?ids=${id(1)},${id(2)}`);
    expect(await screen.findByText('This vehicle is no longer available.')).toBeInTheDocument();
  });

  it('picks the best value only when the vehicles differ', () => {
    expect(bestIndexes([6, 5, 5], 'lower')).toEqual([1, 2]);
    expect(bestIndexes([2018, 2018], 'higher')).toEqual([]);
    expect(bestIndexes([undefined, 30_000], 'lower')).toEqual([]);
  });
});
