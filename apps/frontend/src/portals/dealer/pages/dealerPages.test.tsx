import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const inventoryApi = vi.hoisted(() => ({ listUploads: vi.fn(), uploadCsv: vi.fn(), downloadTemplate: vi.fn() }));
const listingApi = vi.hoisted(() => ({ getMyListingStats: vi.fn(), getMyListings: vi.fn() }));
vi.mock('@/features/inventory/services/inventoryApi', () => ({ inventoryApi }));
vi.mock('@/features/listings/services/listingApi', () => ({ listingApi }));

import { DealerDashboard } from './DealerDashboard';
import { InventoryUpload } from './InventoryUpload';

const job = (id: string, overrides = {}) => ({
  id, fileName: `${id}.csv`, category: 'car', status: 'completed', totalRecords: 10, validRecords: 9, rejectedRecords: 1, createdAt: '2026-09-20T10:00:00Z', ...overrides,
});
const page = <T,>(data: T[]) => ({ data, total: data.length, page: 1, pageSize: 20, totalPages: 1 });

function renderAt(path: string, element: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={path} element={element} />
          <Route path="/dealer/uploads/:id" element={<p>Upload report</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('bulk vehicle upload', () => {
  beforeEach(() => { vi.clearAllMocks(); inventoryApi.listUploads.mockResolvedValue(page([job('march'), job('april', { status: 'completedWithErrors', category: 'motorcycle' })])); });

  it('shows the template fields for the chosen category and the upload history', async () => {
    renderAt('/dealer/uploads/new', <InventoryUpload />);
    expect(await screen.findByText('march.csv')).toBeInTheDocument();
    expect(screen.getByText('april.csv')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'View Report' })[0]).toHaveAttribute('href', '/dealer/uploads/march');
    expect(screen.getByRole('button', { name: /Download Car CSV Template/ })).toBeInTheDocument();
    expect(screen.getByText('registrationNumber')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByRole('combobox'), 'motorcycle');
    expect(screen.getByRole('button', { name: /Download Motorcycle CSV Template/ })).toBeInTheDocument();
    expect(screen.getByText('bikeType')).toBeInTheDocument();
  });

  it('uploads the chosen CSV, then opens its processing report', async () => {
    inventoryApi.uploadCsv.mockImplementation(async (_category: string, _file: File, onProgress: (p: number) => void) => { onProgress(60); return job('new-job'); });
    renderAt('/dealer/uploads/new', <InventoryUpload />);
    const file = new File(['registrationNumber\nCAB-1'], 'stock.csv', { type: 'text/csv' });
    await userEvent.upload(screen.getByLabelText(/Click or drag CSV file/), file);

    expect(screen.getByText('stock.csv')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Start Inventory Upload' }));
    expect(inventoryApi.uploadCsv).toHaveBeenCalledWith('car', file, expect.any(Function));
    expect(await screen.findByText('Upload report')).toBeInTheDocument();
  });

  it('keeps the dealer on the page with a message when the upload or template download fails', async () => {
    inventoryApi.uploadCsv.mockRejectedValue(new Error('The CSV is missing required columns: price'));
    inventoryApi.downloadTemplate.mockRejectedValue(new Error('Template unavailable'));
    renderAt('/dealer/uploads/new', <InventoryUpload />);
    await userEvent.upload(screen.getByLabelText(/Click or drag CSV file/), new File(['x'], 'bad.csv', { type: 'text/csv' }));
    await userEvent.click(screen.getByRole('button', { name: 'Start Inventory Upload' }));
    expect(await screen.findByText('The CSV is missing required columns: price')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Download Car CSV Template/ }));
    expect(await screen.findByText('Template unavailable')).toBeInTheDocument();
  });

  it('downloads the category template as a file', async () => {
    inventoryApi.downloadTemplate.mockResolvedValue(new Blob(['registrationNumber,title']));
    URL.createObjectURL = vi.fn(() => 'blob:template');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    renderAt('/dealer/uploads/new', <InventoryUpload />);
    await userEvent.click(screen.getByRole('button', { name: /Download Car CSV Template/ }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(inventoryApi.downloadTemplate).toHaveBeenCalledWith('car');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:template');
  });

  it('shows an empty history and a history that failed to load', async () => {
    inventoryApi.listUploads.mockResolvedValueOnce(page([]));
    renderAt('/dealer/uploads/new', <InventoryUpload />);
    expect(await screen.findByText('No inventory uploads yet.')).toBeInTheDocument();
  });

  it('says when the upload history cannot be loaded', async () => {
    inventoryApi.listUploads.mockRejectedValue(new Error('down'));
    renderAt('/dealer/uploads/new', <InventoryUpload />);
    expect(await screen.findByText('Could not load upload history.')).toBeInTheDocument();
  });
});

describe('dealer dashboard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows totals by status, recent vehicles, recent uploads and the stale-stock reminder', async () => {
    listingApi.getMyListingStats.mockResolvedValue({ total: 67, active: 22, draft: 29, sold: 0, archived: 16, stale: 1, staleAfterDays: 60 });
    listingApi.getMyListings.mockResolvedValue(page([{
      id: 'l1', title: 'Suzuki Access 125', make: 'Suzuki', model: 'Access 125', year: 2021, price: 540_000, currency: 'LKR', location: 'Colombo', status: 'active',
      category: 'motorcycle', images: [], attributes: { mileageKm: 14_000 },
    }]));
    inventoryApi.listUploads.mockResolvedValue(page([job('motorbikes', { status: 'completedWithErrors' })]));
    renderAt('/dealer', <DealerDashboard />);

    expect(await screen.findByText('67')).toBeInTheDocument();
    expect(screen.getByText('29')).toBeInTheDocument();
    expect(screen.getByText("1 listing hasn't been updated in 60 days.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review now' })).toHaveAttribute('href', '/dealer/listings?view=stale');
    expect(await screen.findByText('2021 Suzuki Access 125')).toBeInTheDocument();
    expect(await screen.findByText('motorbikes.csv')).toBeInTheDocument();
  });

  it('says when the inventory cannot be loaded, and hides the reminder when nothing is stale', async () => {
    listingApi.getMyListingStats.mockRejectedValue(new Error('down'));
    listingApi.getMyListings.mockResolvedValue(page([]));
    inventoryApi.listUploads.mockResolvedValue(page([]));
    renderAt('/dealer', <DealerDashboard />);
    expect(await screen.findByText('Could not load dealer inventory.')).toBeInTheDocument();
    expect(screen.queryByText(/haven't been updated/)).not.toBeInTheDocument();
  });
});
