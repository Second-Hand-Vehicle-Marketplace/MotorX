import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: () => ({ user: null, isAuthenticated: false, logout: vi.fn() }) }));

import { BuyerLayout } from '@/portals/buyer/layout/BuyerLayout';
import { createTranslator, I18nProvider } from './I18nProvider';
import { en } from './messages/en';
import { si } from './messages/si';
import { ta } from './messages/ta';

function renderSite() {
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={['/']}>
        <Routes><Route element={<BuyerLayout />}><Route path="/" element={<p>page</p>} /></Route></Routes>
      </MemoryRouter>
    </I18nProvider>,
  );
}

describe('Sinhala and Tamil support', () => {
  beforeEach(() => { window.localStorage.clear(); document.documentElement.lang = 'en'; });

  it('translates every English message (none left empty or with a lost placeholder)', () => {
    for (const dictionary of [si, ta]) {
      expect(Object.keys(dictionary).sort()).toEqual(Object.keys(en).sort());
      for (const [key, english] of Object.entries(en)) {
        const translated = dictionary[key as keyof typeof en];
        // The two halves around the brand name may be empty (the brand can start or end the title).
        if (!key.startsWith('landing.title')) expect(translated, key).not.toBe('');
        const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
        expect(placeholders(translated), key).toEqual(placeholders(english));
      }
      expect((dictionary['landing.titleBefore'] + dictionary['landing.titleAfter']).trim()).not.toBe('');
    }
  });

  it('fills in placeholders and translates vehicle values', () => {
    const { t, tEnum } = createTranslator('si');
    expect(t('market.showing', { shown: 9, total: 120 })).toBe('වාහන 120 න් 9 ක් පෙන්වයි');
    expect(tEnum('three_wheeler')).toBe('ත්‍රිරෝද රථය');
    expect(createTranslator('ta').tEnum('hybrid')).toBe('ஹைபிரிட்');
    // A value without a translation still reads well.
    expect(createTranslator('ta').tEnum('scooter')).toBe('Scooter');
  });

  it('switches the whole site language, sets the page lang, and remembers the choice', async () => {
    const { unmount } = renderSite();
    expect(screen.getAllByRole('link', { name: 'Browse Vehicles' }).length).toBeGreaterThan(0);

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'si');

    expect(screen.getAllByRole('link', { name: 'වාහන බලන්න' }).length).toBeGreaterThan(0);
    expect(document.documentElement.lang).toBe('si');

    unmount();
    renderSite();
    expect(screen.getByRole('combobox', { name: 'භාෂාව' })).toHaveValue('si');
  });

  it('starts in Tamil for a browser that prefers Tamil', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ta-LK');
    renderSite();
    expect(screen.getByRole('combobox', { name: 'மொழி' })).toHaveValue('ta');
  });
});
