import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { UploadMonitoring } from './UploadMonitoring';
import { ListingMonitoring } from './ListingMonitoring';
const api = vi.hoisted(() => ({ listUsers: vi.fn(), listUploads: vi.fn(), listUploadRecords: vi.fn(), getUserDetails: vi.fn(), listListings: vi.fn() }));
vi.mock('@/features/admin/services/adminApi', () => ({ adminApi: api }));
const job = { id: 'job1', dealerId: 'dealer1', dealerName: 'Dealer', fileName: 'stock.csv', status: 'completedWithErrors', totalRecords: 2, processedRecords: 2, validRecords: 1, rejectedRecords: 1, createdAt: '2026-09-01' };
const listing = { id: 'l1', dealerId: 'dealer1', dealerName: 'Dealer', title: 'Toyota Aqua', year: 2020, make: 'Toyota', model: 'Aqua', registrationNumber: 'ABC-1234', category: 'car', price: 1000, currency: 'LKR', status: 'sold', createdAt: '2026-09-01' };
beforeEach(() => { vi.clearAllMocks(); api.listUsers.mockResolvedValue({ users: [] }); api.listUploads.mockResolvedValue({ uploads: [job], meta: null }); api.getUserDetails.mockResolvedValue({ id: 'dealer1', displayName: 'Dealer', email: 'owner@example.com', phone: '0771234567', role: 'dealer', status: 'active', createdAt: '2026-09-01', dealer: { businessName: 'Aqua Motors', businessEmail: 'sales@example.com', businessPhone: '0112345678', address: '25 Main Street', brands: [] } }); });
it('opens a bulk collection, shows current listing status, and switches to rejected rows', async () => {
  api.listUploadRecords.mockImplementation((_id, outcome) => Promise.resolve({ records: outcome === 'completed' ? [{ ...listing, outcome, rowNumber: 2 }] : [{ id: 'r1', outcome, rowNumber: 3, originalData: { title: 'Invalid car' }, reason: 'validation', errors: ['Price must be positive'] }], meta: null }));
  render(<MemoryRouter><UploadMonitoring /></MemoryRouter>);
  await userEvent.click(await screen.findByRole('button', { name: 'stock.csv' }));
  expect(await screen.findByText('sold')).toBeInTheDocument();
  await userEvent.selectOptions(screen.getByLabelText('Row outcome'), 'rejected');
  expect(await screen.findByText('Price must be positive')).toBeInTheDocument();
  expect(screen.getByText('Invalid car')).toBeInTheDocument();
  expect(api.listUploadRecords).toHaveBeenLastCalledWith('job1', 'rejected', 1);
});
it('opens the listing owner account with dealership contact details', async () => {
  api.listListings.mockResolvedValue({ listings: [listing] });
  render(<ListingMonitoring />);
  await userEvent.click(await screen.findByRole('button', { name: 'Toyota Aqua' }));
  expect(await screen.findByText('sales@example.com')).toBeInTheDocument();
  expect(screen.getByText('0112345678')).toBeInTheDocument();
  expect(screen.getByText('25 Main Street')).toBeInTheDocument();
  expect(api.getUserDetails).toHaveBeenCalledWith('dealer1');
});
it('reports collection load failures', async () => {
  api.listUploadRecords.mockRejectedValue(new Error('Records unavailable'));
  render(<MemoryRouter><UploadMonitoring /></MemoryRouter>);
  await userEvent.click(await screen.findByRole('button', { name: 'stock.csv' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Records unavailable');
});
