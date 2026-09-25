import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ authStateListener: undefined as undefined | ((signedIn: boolean) => void), getCurrentUser: vi.fn(), signOut: vi.fn(), getMyDealerApplication: vi.fn() }));
vi.mock('../services/firebaseAuth', () => ({ firebaseAuth: { onAuthStateChanged: (listener: (signedIn: boolean) => void) => { mocks.authStateListener = listener; return () => undefined; }, signOut: mocks.signOut } }));
vi.mock('../services/authApi', () => ({ authApi: { getCurrentUser: mocks.getCurrentUser } }));
vi.mock('../../dealers/services/dealerApi', () => ({ getMyDealerApplication: mocks.getMyDealerApplication, submitDealerApplication: vi.fn() }));

import { AuthProvider } from './AuthProvider';
import { useAuth } from '../hooks/useAuth';

function LogoutButton() { const { logout, user } = useAuth(); return <><span>{user?.email ?? 'signed out'}</span><button onClick={() => void logout()}>Sign out</button></>; }

describe('AuthProvider cached data', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getMyDealerApplication.mockRejectedValue(new Error('none')); mocks.signOut.mockResolvedValue(undefined); });

  it("clears the previous account's cached data on sign-out, so the next user never sees it", async () => {
    const queryClient = new QueryClient();
    mocks.getCurrentUser.mockResolvedValue({ id: 'u1', email: 'dealer@example.com', role: 'dealer' });
    render(<QueryClientProvider client={queryClient}><AuthProvider><LogoutButton /></AuthProvider></QueryClientProvider>);
    await act(async () => { mocks.authStateListener!(true); });
    expect(await screen.findByText('dealer@example.com')).toBeInTheDocument();

    queryClient.setQueryData(['upload', 'job-1'], { fileName: 'private-stock.csv' });
    await act(async () => { screen.getByRole('button', { name: 'Sign out' }).click(); });

    await waitFor(() => expect(screen.getByText('signed out')).toBeInTheDocument());
    expect(queryClient.getQueryData(['upload', 'job-1'])).toBeUndefined();
  });

  it('clears cached data when a different account signs in on the same browser', async () => {
    const queryClient = new QueryClient();
    mocks.getCurrentUser.mockResolvedValueOnce({ id: 'u1', email: 'first@example.com', role: 'buyer' }).mockResolvedValueOnce({ id: 'u2', email: 'second@example.com', role: 'buyer' });
    render(<QueryClientProvider client={queryClient}><AuthProvider><LogoutButton /></AuthProvider></QueryClientProvider>);
    await act(async () => { mocks.authStateListener!(true); });
    queryClient.setQueryData(['notifications'], ['for first user']);

    await act(async () => { mocks.authStateListener!(true); }); // Firebase reports a new signed-in account

    expect(await screen.findByText('second@example.com')).toBeInTheDocument();
    expect(queryClient.getQueryData(['notifications'])).toBeUndefined();
  });
});
