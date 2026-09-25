import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const useAuth = vi.hoisted(() => vi.fn());
vi.mock('../hooks/useAuth', () => ({ useAuth }));

import { RoleGuard } from './RoleGuard';

// Renders a dealer-only page behind the guard, plus the pages it may redirect to.
function renderDealerPage() {
  render(
    <MemoryRouter initialEntries={['/dealer']}>
      <Routes>
        <Route element={<RoleGuard allowedRoles={['dealer']} />}>
          <Route path="/dealer" element={<p>Dealer dashboard</p>} />
        </Route>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/dealer/application-status" element={<p>Application status</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RoleGuard', () => {
  it('sends signed-out visitors to the login page', () => {
    useAuth.mockReturnValue({ user: null, isAuthenticated: false, isLoading: false });
    renderDealerPage();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('shows the page to a user with an allowed role', () => {
    useAuth.mockReturnValue({ user: { role: 'dealer' }, isAuthenticated: true, isLoading: false });
    renderDealerPage();
    expect(screen.getByText('Dealer dashboard')).toBeInTheDocument();
  });

  it('shows "Access Restricted" to a signed-in user without the role', () => {
    useAuth.mockReturnValue({ user: { role: 'buyer' }, isAuthenticated: true, isLoading: false });
    renderDealerPage();
    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    expect(screen.queryByText('Dealer dashboard')).not.toBeInTheDocument();
  });

  it('sends an applicant whose dealer application is still pending to the status page', () => {
    useAuth.mockReturnValue({ user: { role: 'buyer', dealerStatus: 'pending' }, isAuthenticated: true, isLoading: false });
    renderDealerPage();
    expect(screen.getByText('Application status')).toBeInTheDocument();
  });
});
