import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/notifications/components/NotificationCenter', () => ({ NotificationCenter: () => null }));

import { PortalLayout } from './PortalLayout';
import { ResponsiveTable } from './ResponsiveTable';

function renderPortal() {
  const sections = [{ links: [{ to: '/dealer', end: true, label: 'Dashboard', icon: null }, { to: '/dealer/listings', label: 'My Listings', icon: null }] }];
  render(
    <MemoryRouter initialEntries={['/dealer']}>
      <Routes>
        <Route element={<PortalLayout brand="MotorX" sections={sections} userName="Nimal Perera" userRole="Dealer" onSignOut={vi.fn()} toolbarLabel="Dealer workspace" />}>
          <Route path="/dealer" element={<Link to="/dealer/listings">go</Link>} />
          <Route path="/dealer/listings" element={<p>Listings page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('portal navigation on phones and tablets', () => {
  it('opens the menu as a drawer and moves focus into it', async () => {
    renderPortal();
    const button = screen.getByRole('button', { name: 'Open menu' });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(button);

    expect(screen.getByRole('button', { name: 'Close menu', expanded: true })).toBeInTheDocument();
    expect(document.getElementById('portal-sidebar')).toHaveClass('is-open');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveFocus();
  });

  it('closes on Escape (focus back on the button) and after choosing a page', async () => {
    renderPortal();
    const button = screen.getByRole('button', { name: 'Open menu' });
    await userEvent.click(button);
    await userEvent.keyboard('{Escape}');
    expect(document.getElementById('portal-sidebar')).not.toHaveClass('is-open');
    expect(button).toHaveFocus();

    await userEvent.click(button);
    await userEvent.click(screen.getByRole('link', { name: 'My Listings' }));
    expect(await screen.findByText('Listings page')).toBeInTheDocument();
    expect(document.getElementById('portal-sidebar')).not.toHaveClass('is-open');
  });
});

describe('tables on phones', () => {
  it('labels every cell with its column heading, so each row can be shown as a card', () => {
    render(<ResponsiveTable><thead><tr><th>Vehicle</th><th>Price</th></tr></thead><tbody><tr><td>Toyota Aqua</td><td>Rs 6,000,000</td></tr></tbody></ResponsiveTable>);
    expect(screen.getByText('Toyota Aqua')).toHaveAttribute('data-label', 'Vehicle');
    expect(screen.getByText('Rs 6,000,000')).toHaveAttribute('data-label', 'Price');
  });
});
