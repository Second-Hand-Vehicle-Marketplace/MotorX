import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listingApi = vi.hoisted(() => ({
  getMyListing: vi.fn(), createListing: vi.fn(), updateListing: vi.fn(), uploadImage: vi.fn(), deleteImage: vi.fn(), reorderImages: vi.fn(),
}));
vi.mock('@/features/listings/services/listingApi', () => ({ listingApi }));
// The cropper draws on a canvas, which jsdom cannot do; a stand-in lets the test crop or skip a photo.
vi.mock('@/features/listings/components/ImageCropModal', () => ({
  ImageCropModal: ({ file, onConfirm, onCancel }: { file: File; onConfirm: (f: File) => void; onCancel: () => void }) => (
    <div role="dialog" aria-label={`Crop ${file.name}`}>
      <button type="button" onClick={() => onConfirm(new File(['cropped'], `cropped-${file.name}`, { type: 'image/jpeg' }))}>Use crop</button>
      <button type="button" onClick={onCancel}>Skip</button>
    </div>
  ),
}));

import { ListingForm } from './ListingForm';

const saved = (overrides = {}) => ({
  id: 'l1', dealerId: 'd', registrationNumber: 'CAB-1234', title: 'Toyota Aqua 2018', make: 'Toyota', model: 'Aqua', year: 2018, price: 6_000_000, currency: 'LKR', location: 'Colombo',
  description: 'Clean', status: 'draft', category: 'car', publishedAt: null, lastConfirmedAt: null,
  attributes: { bodyType: 'hatchback', condition: 'used', mileageKm: 60_000, fuelType: 'hybrid', transmission: 'automatic', engineCapacityCc: 1500 },
  images: [{ id: 'k1', url: 'https://img/1.jpg', alt: 'Front', isPrimary: true }, { id: 'k2', url: 'https://img/2.jpg', alt: 'Side', isPrimary: false }], ...overrides,
});

function renderForm(path = '/dealer/listings/new') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/dealer/listings/new" element={<ListingForm />} />
        <Route path="/dealer/listings/:listingId/edit" element={<ListingForm />} />
        <Route path="/dealer/listings" element={<p>Listings page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}
const field = (label: RegExp) => screen.getByLabelText(label);
async function fillRequired() {
  await userEvent.type(field(/^Registration Number/), 'CAB-1234');
  await userEvent.selectOptions(field(/^Make \*/), 'Toyota');
  await userEvent.type(field(/^Model \*/), 'Aqua');
  await userEvent.clear(field(/^Year of Manufacture/)); await userEvent.type(field(/^Year of Manufacture/), '2018');
  await userEvent.type(field(/^Mileage/), '60000');
  await userEvent.type(field(/^Location/), 'Colombo');
  await userEvent.clear(field(/^Price/)); await userEvent.type(field(/^Price/), '6000000');
  await userEvent.type(field(/^Listing Title/), 'Toyota Aqua 2018');
}

describe('dealer listing form', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('creates a car listing with only the fields that apply, then returns to the listings', async () => {
    listingApi.createListing.mockResolvedValue(saved());
    renderForm();
    expect(screen.getByRole('heading', { name: 'Add New Vehicle Listing' })).toBeInTheDocument();
    await fillRequired();
    await userEvent.type(field(/^Engine Capacity/), '1500');
    await userEvent.type(field(/^Edition/), 'G');
    await userEvent.selectOptions(field(/^Initial Status/), 'active');
    await userEvent.click(screen.getByRole('button', { name: 'Create Listing' }));

    expect(listingApi.createListing).toHaveBeenCalledWith(expect.objectContaining({
      registrationNumber: 'CAB-1234', make: 'Toyota', model: 'Aqua', year: 2018, price: 6_000_000, status: 'active', category: 'car',
      attributes: { fuelType: 'petrol', transmission: 'automatic', condition: 'used', mileageKm: 60_000, edition: 'G', engineCapacityCc: 1500, bodyType: 'sedan' },
    }));
    expect(await screen.findByText('Listing saved successfully.')).toBeInTheDocument();
    expect(await screen.findByText('Listings page', {}, { timeout: 2000 })).toBeInTheDocument();
  });

  it('asks for battery details for electric vehicles and the extra field of each vehicle type', async () => {
    renderForm();
    await userEvent.selectOptions(field(/^Fuel Type/), 'electric');
    expect(screen.queryByLabelText(/^Engine Capacity/)).not.toBeInTheDocument();
    expect(field(/^Battery Capacity/)).toBeRequired();
    expect(field(/^Battery Range/)).toBeRequired();

    await userEvent.selectOptions(field(/^Fuel Type/), 'plug_in_hybrid');
    expect(field(/^Engine Capacity/)).toBeInTheDocument();
    expect(field(/^Battery Capacity/)).toBeInTheDocument();

    await userEvent.selectOptions(field(/^Vehicle Category/), 'motorcycle');
    expect(field(/^Bike Type/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Body Type/)).not.toBeInTheDocument();
    await userEvent.selectOptions(field(/^Vehicle Category/), 'van');
    expect(field(/^Seating Capacity/)).toBeInTheDocument();
    await userEvent.selectOptions(field(/^Vehicle Category/), 'truck');
    expect(field(/^Payload Capacity/)).toBeInTheDocument();
    await userEvent.selectOptions(field(/^Vehicle Category/), 'three_wheeler');
    expect(screen.queryByLabelText(/^Edition/)).not.toBeInTheDocument();
  });

  it('sends the extras of each vehicle type', async () => {
    listingApi.createListing.mockResolvedValue(saved());
    renderForm();
    await fillRequired();
    await userEvent.selectOptions(field(/^Vehicle Category/), 'truck');
    await userEvent.selectOptions(field(/^Fuel Type/), 'diesel');
    await userEvent.type(field(/^Engine Capacity/), '3000');
    await userEvent.type(field(/^Payload Capacity/), '2500');
    await userEvent.click(screen.getByRole('button', { name: 'Create Listing' }));
    await waitFor(() => expect(listingApi.createListing).toHaveBeenCalledWith(expect.objectContaining({ category: 'truck', attributes: expect.objectContaining({ fuelType: 'diesel', engineCapacityCc: 3000, payloadCapacityKg: 2500 }) })));
  });

  it('crops each chosen photo, uploads it after saving, and offers a retry when an upload fails', async () => {
    listingApi.createListing.mockResolvedValue(saved({ id: 'new1' }));
    listingApi.uploadImage.mockRejectedValueOnce(new Error('Photo too large'));
    renderForm();
    await fillRequired();
    await userEvent.type(field(/^Engine Capacity/), '1500');

    const photos = [new File(['a'], 'front.jpg', { type: 'image/jpeg' }), new File(['b'], 'side.jpg', { type: 'image/jpeg' })];
    await userEvent.upload(field(/^Vehicle Images/), photos);
    expect(screen.getByText('Cropping 1 of 2…')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Use crop' }));
    expect(screen.getByRole('dialog', { name: 'Crop side.jpg' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(screen.getByText('1 image(s) selected')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Create Listing' }));
    await waitFor(() => expect(listingApi.uploadImage).toHaveBeenCalledWith('new1', expect.objectContaining({ name: 'cropped-front.jpg' }), 'Toyota Aqua 2018'));
    expect(await screen.findByText(/Photo too large/)).toBeInTheDocument();

    // The listing itself was saved, so pressing the button again only retries the photos.
    listingApi.updateListing.mockResolvedValue(saved({ id: 'new1' }));
    listingApi.uploadImage.mockResolvedValue(saved({ id: 'new1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Retry Uploads' }));
    await waitFor(() => expect(listingApi.updateListing).toHaveBeenCalledWith('new1', expect.anything()));
    expect(await screen.findByText('Listing saved successfully.')).toBeInTheDocument();
  });

  it('keeps no photos when every crop is skipped', async () => {
    renderForm();
    await userEvent.upload(field(/^Vehicle Images/), [new File(['a'], 'front.jpg', { type: 'image/jpeg' })]);
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(screen.getByText('0 image(s) selected')).toBeInTheDocument();
  });

  it('edits an existing listing: loads it, reorders and removes photos, and saves', async () => {
    listingApi.getMyListing.mockResolvedValue(saved());
    listingApi.reorderImages.mockResolvedValue(saved({ images: [saved().images[1], saved().images[0]] }));
    listingApi.deleteImage.mockResolvedValue(saved({ images: [saved().images[0]] }));
    listingApi.updateListing.mockResolvedValue(saved());
    renderForm('/dealer/listings/l1/edit');

    expect(await screen.findByRole('heading', { name: 'Edit Vehicle Listing' })).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Toyota Aqua 2018')).toBeInTheDocument();
    expect(field(/^Engine Capacity/)).toHaveValue(1500);

    await userEvent.click(screen.getAllByRole('button', { name: 'Right' })[0]!);
    expect(listingApi.reorderImages).toHaveBeenCalledWith('l1', ['k2', 'k1']);
    expect(await screen.findByText('Image order saved.')).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[1]!);
    expect(listingApi.deleteImage).toHaveBeenCalledWith('l1', expect.any(String));
    expect(await screen.findByText('Image removed.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Save Listing' }));
    await waitFor(() => expect(listingApi.updateListing).toHaveBeenCalledWith('l1', expect.objectContaining({ category: 'car', attributes: expect.objectContaining({ bodyType: 'hatchback', fuelType: 'hybrid', engineCapacityCc: 1500 }) })));
  });

  it('reports load and photo-order errors', async () => {
    listingApi.getMyListing.mockRejectedValueOnce(new Error('Listing not found'));
    renderForm('/dealer/listings/zz/edit');
    expect(await screen.findByText('Listing not found')).toBeInTheDocument();
  });

  it('reports a failed reorder and a failed save', async () => {
    listingApi.getMyListing.mockResolvedValue(saved());
    listingApi.reorderImages.mockRejectedValue(new Error('Could not save order'));
    listingApi.updateListing.mockRejectedValue(new Error('Registration already listed'));
    renderForm('/dealer/listings/l1/edit');
    await userEvent.click((await screen.findAllByRole('button', { name: 'Left' }))[1]!);
    expect(await screen.findByText('Could not save order')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save Listing' }));
    expect(await screen.findByText(/Registration already listed/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByText('Listings page')).toBeInTheDocument();
  });
});
