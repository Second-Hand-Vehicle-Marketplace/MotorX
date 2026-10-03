import React, { useEffect, useState } from 'react';
import { adminApi, type AdminUserDetails } from '@/features/admin/services/adminApi';
import { formatDate } from '@/shared/utils/formatters';

export function AccountDetails({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [user, setUser] = useState<AdminUserDetails | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setUser(null); setError('');
    adminApi.getUserDetails(userId).then((value) => { if (active) setUser(value); }).catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : 'Unable to load account.'); });
    return () => { active = false; };
  }, [userId]);
  const fields = user ? { Name: user.displayName, Email: user.email, Phone: user.phone, Role: user.role, 'Account status': user.status, Joined: formatDate(user.createdAt), 'Last login': formatDate(user.lastLoginAt), ...(user.dealer ? {
    Business: user.dealer.businessName, Representative: user.dealer.representativeName, 'Business email': user.dealer.businessEmail, 'Business phone': user.dealer.businessPhone, 'Contact phone': user.dealer.phone, Address: user.dealer.address, City: user.dealer.city, Province: user.dealer.province, Website: user.dealer.website, 'Business registration': user.dealer.registrationNumber, 'Dealership type': user.dealer.dealershipType, Brands: user.dealer.brands.join(', '), Description: user.dealer.description, 'Declared inventory': user.dealer.inventoryCount, 'Dealer approval': user.dealer.status, 'Rejection reason': user.dealer.rejectionReason,
  } : {}) } : {};
  return <section className="glass-card" aria-label="Account details" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
    <button className="btn btn-secondary btn-sm" onClick={onClose}>Close account details</button>
    <h2>Account details</h2>
    {error ? <p role="alert">{error}</p> : !user ? <p>Loading account details...</p> : <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 1fr) minmax(0, 2fr)', gap: '0.75rem', overflowWrap: 'anywhere' }}>{Object.entries(fields).map(([label, value]) => <React.Fragment key={label}><dt>{label}</dt><dd style={{ margin: 0 }}>{value === undefined || value === null || value === '' ? 'Not provided' : value}</dd></React.Fragment>)}</dl>}
  </section>;
}
