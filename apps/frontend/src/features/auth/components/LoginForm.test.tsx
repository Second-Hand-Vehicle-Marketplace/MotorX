import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ login: vi.fn(), sendPasswordReset: vi.fn() }));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ login: mocks.login }) }));
vi.mock('../services/firebaseAuth', () => ({ firebaseAuth: { sendPasswordReset: mocks.sendPasswordReset } }));

import { LoginForm } from './LoginForm';

function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        {['/dealer', '/admin', '/marketplace', '/dealer/application-status'].map((path) => <Route key={path} path={path} element={<p>Landed on {path}</p>} />)}
      </Routes>
    </MemoryRouter>,
  );
}
async function signIn(email = ' nimal@example.com ', password = 'secret-pass') {
  await userEvent.type(screen.getByPlaceholderText('name@example.com'), email);
  await userEvent.type(screen.getByLabelText(/^Password/), password);
  await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
}

describe('sign-in form', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    [{ role: 'dealer' }, '/dealer'],
    [{ role: 'admin' }, '/admin'],
    [{ role: 'buyer' }, '/marketplace'],
    [{ role: 'buyer', dealerStatus: 'pending' }, '/dealer/application-status'],
    [{ role: 'buyer', dealerStatus: 'rejected' }, '/dealer/application-status'],
  ])('sends %o to the right place after signing in', async (user, destination) => {
    mocks.login.mockResolvedValue(user);
    renderLogin();
    await signIn();
    expect(mocks.login).toHaveBeenCalledWith('nimal@example.com', 'secret-pass');
    expect(await screen.findByText(`Landed on ${destination}`)).toBeInTheDocument();
  });

  it('explains a wrong password and a lockout in plain words', async () => {
    mocks.login.mockRejectedValueOnce({ code: 'auth/invalid-credential' });
    renderLogin();
    await signIn();
    expect(await screen.findByRole('alert')).toHaveTextContent('The email address or password is incorrect.');

    mocks.login.mockRejectedValueOnce({ code: 'auth/too-many-requests' });
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts. Please wait before trying again.');

    mocks.login.mockRejectedValueOnce(new Error('This account has been suspended.'));
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This account has been suspended.');
  });

  it('shows and hides the password', async () => {
    renderLogin();
    const password = screen.getByLabelText(/^Password/);
    expect(password).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Show' }));
    expect(password).toHaveAttribute('type', 'text');
    await userEvent.click(screen.getByRole('button', { name: 'Hide' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('asks for the email before sending a reset link, then confirms it was sent', async () => {
    mocks.sendPasswordReset.mockResolvedValueOnce(undefined);
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your email address before requesting a password reset.');
    expect(mocks.sendPasswordReset).not.toHaveBeenCalled();

    await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'nimal@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    expect(mocks.sendPasswordReset).toHaveBeenCalledWith('nimal@example.com');
    expect(await screen.findByRole('alert')).toHaveTextContent('Password reset instructions have been sent to your email.');

    mocks.sendPasswordReset.mockRejectedValueOnce({ code: 'auth/too-many-requests' });
    await userEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts');
  });
});
