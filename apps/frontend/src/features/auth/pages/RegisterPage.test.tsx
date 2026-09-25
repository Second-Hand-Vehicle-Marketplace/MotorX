import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ useAuth: vi.fn(), getMyDealerApplication: vi.fn(), submitDealerApplication: vi.fn(), refreshUser: vi.fn() }));
vi.mock('../hooks/useAuth', () => ({ useAuth: mocks.useAuth }));
vi.mock('../../dealers/services/dealerApi', () => ({ getMyDealerApplication: mocks.getMyDealerApplication, submitDealerApplication: mocks.submitDealerApplication }));

import { RegisterPage } from './RegisterPage';

const rejected = {
  id: 'app-1', userId: 'u1', status: 'rejected', rejectionReason: 'Registration certificate is unreadable.', reviewedAt: '2026-09-20T10:00:00Z',
  businessName: 'Lanka Motors', registrationNumber: 'REG-LM-1', representativeName: 'Nimal Perera', phone: '0112345678', businessPhone: '0112345679',
  businessEmail: 'sales@lankamotors.lk', address: '12 Galle Road, Colombo', city: 'Colombo', province: 'Western', website: null, dealershipType: 'used',
  brands: ['Toyota'], description: 'Family-run used car dealership in Colombo since 2005.', inventoryCount: 40, reviewHistory: [],
};

function renderForSignedInBuyer() {
  mocks.useAuth.mockReturnValue({ user: { id: 'u1', role: 'buyer', email: 'nimal@example.com', displayName: 'Nimal Perera' }, isAuthenticated: true, refreshUser: mocks.refreshUser, registerBuyer: vi.fn(), registerDealerApplication: vi.fn() });
  render(<MemoryRouter initialEntries={['/dealer/apply']}><Routes><Route path="/dealer/apply" element={<RegisterPage mode="dealer" />} /><Route path="/dealer/application-status" element={<p>Status page</p>} /></Routes></MemoryRouter>);
}

describe('RegisterPage for a signed-in buyer', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.refreshUser.mockResolvedValue({}); });

  it('shows the rejection reason, pre-fills the previous answers, and asks for no password', async () => {
    mocks.getMyDealerApplication.mockResolvedValue(rejected);
    renderForSignedInBuyer();

    expect(await screen.findByText('Registration certificate is unreadable.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Correct and Resubmit Your Application' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByDisplayValue('Lanka Motors')).toBeInTheDocument());
    expect(screen.queryByText('Password')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resubmit Application' })).toBeInTheDocument();
  });

  it('resubmits from the existing account with the new documents', async () => {
    mocks.getMyDealerApplication.mockResolvedValue(rejected);
    mocks.submitDealerApplication.mockResolvedValue({ ...rejected, status: 'pending' });
    renderForSignedInBuyer();
    await waitFor(() => expect(screen.getByDisplayValue('Lanka Motors')).toBeInTheDocument());

    const [registration, identity] = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    await userEvent.upload(registration!, new File(['%PDF-1.7'], 'br.pdf', { type: 'application/pdf' }));
    await userEvent.upload(identity!, new File(['%PDF-1.7'], 'id.pdf', { type: 'application/pdf' }));
    // jsdom cannot see files attached by user-event when checking `required`, so submit the form directly
    // (the page still verifies both documents itself before sending).
    fireEvent.submit(screen.getByRole('button', { name: 'Resubmit Application' }).closest('form')!);

    expect(await screen.findByText('Status page')).toBeInTheDocument();
    expect(mocks.submitDealerApplication).toHaveBeenCalledWith(expect.objectContaining({ businessName: 'Lanka Motors', registrationNumber: 'REG-LM-1', businessEmail: 'sales@lankamotors.lk' }), expect.objectContaining({ businessRegistration: expect.any(File), identityProof: expect.any(File) }));
    expect(mocks.refreshUser).toHaveBeenCalled();
  });

  it('sends an applicant whose application is still pending to the status page', async () => {
    mocks.getMyDealerApplication.mockResolvedValue({ ...rejected, status: 'pending' });
    renderForSignedInBuyer();
    expect(await screen.findByText('Status page')).toBeInTheDocument();
  });
});
