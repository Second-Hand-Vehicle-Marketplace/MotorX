import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getMine: vi.fn(), update: vi.fn() }));
vi.mock('@/features/dealers/services/dealerApi', () => ({ getMyDealerApplication: mocks.getMine, updateMyDealerProfile: mocks.update }));

import { DealerProfile } from './DealerProfile';

const dealer = {
  id: 'd1', businessName: 'Lanka Motors', registrationNumber: 'REG-LM-1', representativeName: 'Nimal Perera', phone: '0112345678', businessPhone: '0112345679',
  businessEmail: 'sales@lankamotors.lk', address: '12 Galle Road, Colombo', city: 'Colombo', province: 'Western', website: 'https://old.example.com',
  dealershipType: 'used', brands: ['Toyota', 'Honda'], description: 'Family-run used car dealership in Colombo since 2005.', inventoryCount: 40, status: 'approved',
};

describe('DealerProfile', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getMine.mockResolvedValue(dealer); });

  it('shows the verified business name and registration number as read-only', async () => {
    render(<DealerProfile />);
    expect(await screen.findByText('Lanka Motors')).toBeInTheDocument();
    expect(screen.getByText('REG-LM-1')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Lanka Motors')).not.toBeInTheDocument(); // not an editable field
  });

  it('saves edited details and confirms', async () => {
    mocks.update.mockResolvedValue({ ...dealer, city: 'Kandy', website: null });
    render(<DealerProfile />);
    const city = await screen.findByDisplayValue('Colombo');
    await userEvent.clear(city);
    await userEvent.type(city, 'Kandy');
    await userEvent.clear(screen.getByDisplayValue('https://old.example.com'));
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(await screen.findByText(/Your business profile was saved/)).toBeInTheDocument();
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ city: 'Kandy', website: '', brands: ['Toyota', 'Honda'], inventoryCount: 40 }));
  });

  it('shows the server message when saving fails', async () => {
    mocks.update.mockRejectedValue(new Error('Business email is invalid.'));
    render(<DealerProfile />);
    await userEvent.click(await screen.findByRole('button', { name: 'Save profile' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Business email is invalid.');
  });
});
