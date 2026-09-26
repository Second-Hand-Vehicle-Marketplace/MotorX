import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UploadJob } from '@/features/inventory/types/inventory.types';

const inventoryApi = vi.hoisted(() => ({ getUpload: vi.fn(), getRejectedRecords: vi.fn(), retryUpload: vi.fn(), retryImages: vi.fn(), uploadImagesZip: vi.fn() }));
vi.mock('@/features/inventory/services/inventoryApi', () => ({ inventoryApi }));
const listingApi = vi.hoisted(() => ({ getMyListings: vi.fn(), bulkAction: vi.fn() }));
vi.mock('@/features/listings/services/listingApi', () => ({ listingApi }));

import { UploadDetails } from './UploadDetails';

const job = (overrides: Partial<UploadJob> = {}): UploadJob => ({
  id: 'job-1', dealerId: 'dealer-1', fileName: 'stock.csv', fileSize: 2_048, category: 'car', status: 'completed',
  totalRecords: 10, processedRecords: 10, validRecords: 9, rejectedRecords: 1, duplicateRecords: 0, failureReason: null,
  createdAt: '2026-09-25T10:00:00Z', completedAt: '2026-09-25T10:01:00Z',
  imageProcessingStatus: 'none', imageZipFileName: null, imagesAttached: 0, matchedListings: 0, unmatchedFolders: [], imageFailureReason: null, imageCompletedAt: null,
  ...overrides,
});

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dealer/uploads/job-1']}>
        <Routes><Route path="/dealer/uploads/:uploadId" element={<UploadDetails />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('UploadDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inventoryApi.getRejectedRecords.mockResolvedValue({ data: [], pagination: {} });
    listingApi.getMyListings.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 1, totalPages: 0 });
  });

  it("publishes all of this upload's drafts in one step", async () => {
    inventoryApi.getUpload.mockResolvedValue(job());
    listingApi.getMyListings.mockResolvedValueOnce({ data: [], total: 9, page: 1, pageSize: 1, totalPages: 9 });
    listingApi.bulkAction.mockResolvedValue({ action: 'publish', matched: 9, updated: 9, skipped: 0 });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Publish all 9' }));

    expect(listingApi.getMyListings).toHaveBeenCalledWith(1, 1, { status: 'draft', uploadJobId: 'job-1' });
    expect(listingApi.bulkAction).toHaveBeenCalledWith({ action: 'publish', uploadJobId: 'job-1' });
    expect(await screen.findByText('9 listings published.')).toBeInTheDocument();
  });

  it('shows the failure reason and lets the dealer retry a failed CSV import', async () => {
    inventoryApi.getUpload.mockResolvedValueOnce(job({ status: 'failed', failureReason: 'Storage was unavailable.' })).mockResolvedValue(job({ status: 'pending' }));
    inventoryApi.retryUpload.mockResolvedValue(job({ status: 'pending' }));
    renderPage();

    expect(await screen.findByText(/Storage was unavailable/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(inventoryApi.retryUpload).toHaveBeenCalledWith('job-1');
    expect(await screen.findByText('stock.csv')).toBeInTheDocument();
    expect(inventoryApi.getUpload).toHaveBeenCalledTimes(2); // refreshed to show the new status
  });

  it('lets the dealer retry failed photo processing', async () => {
    inventoryApi.getUpload.mockResolvedValue(job({ imageProcessingStatus: 'failed', imageZipFileName: 'photos.zip', imageFailureReason: 'Storage timed out.' }));
    inventoryApi.retryImages.mockResolvedValue(job({ imageProcessingStatus: 'pending' }));
    renderPage();

    expect(await screen.findByText(/Storage timed out/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(inventoryApi.retryImages).toHaveBeenCalledWith('job-1');
    expect(inventoryApi.retryUpload).not.toHaveBeenCalled();
  });

  it('shows an error message when the retry is refused', async () => {
    inventoryApi.getUpload.mockResolvedValue(job({ status: 'failed', failureReason: 'Bad file.' }));
    inventoryApi.retryUpload.mockRejectedValue(new Error('Only a failed upload can be retried.'));
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Only a failed upload can be retried.')).toBeInTheDocument();
  });

  it('does not offer Retry for an upload that succeeded', async () => {
    inventoryApi.getUpload.mockResolvedValue(job());
    renderPage();

    expect(await screen.findByText('stock.csv')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });
});
