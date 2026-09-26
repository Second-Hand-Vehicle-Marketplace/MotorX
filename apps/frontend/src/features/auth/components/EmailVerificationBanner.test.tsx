import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseAuth = vi.hoisted(() => ({ onUserChanged: vi.fn(), resendEmailVerification: vi.fn(), refreshEmailVerification: vi.fn() }));
vi.mock('../services/firebaseAuth', () => ({ firebaseAuth }));

import { EmailVerificationBanner } from './EmailVerificationBanner';

// Renders the banner as if Firebase reported this signed-in user (or nobody).
function renderFor(user: { email: string; emailVerified: boolean } | null) {
  firebaseAuth.onUserChanged.mockImplementation((callback: (user: unknown) => void) => { callback(user); return () => undefined; });
  render(<EmailVerificationBanner />);
}

describe('EmailVerificationBanner', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('is hidden when nobody is signed in or the email is verified', () => {
    renderFor(null);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    renderFor({ email: 'buyer@example.com', emailVerified: true });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('asks an unverified user to verify, and can resend the email', async () => {
    firebaseAuth.resendEmailVerification.mockResolvedValue(undefined);
    renderFor({ email: 'new@example.com', emailVerified: false });

    expect(screen.getByRole('status')).toHaveTextContent('new@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Resend email' }));

    expect(firebaseAuth.resendEmailVerification).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Verification email sent.')).toBeInTheDocument();
  });

  it('disappears once the user has verified', async () => {
    firebaseAuth.refreshEmailVerification.mockResolvedValue(true);
    renderFor({ email: 'new@example.com', emailVerified: false });

    await act(async () => { await userEvent.click(screen.getByRole('button', { name: 'I have verified' })); });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('explains when the link has not been opened yet', async () => {
    firebaseAuth.refreshEmailVerification.mockResolvedValue(false);
    renderFor({ email: 'new@example.com', emailVerified: false });

    await userEvent.click(screen.getByRole('button', { name: 'I have verified' }));

    expect(await screen.findByText(/Not verified yet/)).toBeInTheDocument();
  });
});
