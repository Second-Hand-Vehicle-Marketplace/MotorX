import React, { useEffect, useState } from 'react';
import { getMyDealerApplication, updateMyDealerProfile } from '@/features/dealers/services/dealerApi';
import type { DealerApplication } from '@/features/dealers/types/dealer.types';

export const DealerProfile: React.FC = () => {
  const [profile, setProfile] = useState<DealerApplication | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void getMyDealerApplication().then(setProfile).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Could not load your business profile.'));
  }, []);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await updateMyDealerProfile({
        businessName: profile.businessName, phone: profile.phone, address: profile.address,
        representativeName: profile.representativeName, city: profile.city, province: profile.province,
        businessPhone: profile.businessPhone, businessEmail: profile.businessEmail,
        website: profile.website ?? undefined, dealershipType: profile.dealershipType,
        brands: profile.brands, description: profile.description, inventoryCount: profile.inventoryCount ?? undefined,
      });
      setProfile(updated);
      setMessage('Business profile saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your business profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile && !error) return <div role="status" className="loading-spinner" style={{ margin: '3rem auto', display: 'block' }} />;
  if (!profile) return <div role="alert" className="glass-card" style={{ padding: '1rem', color: 'var(--color-error)' }}>{error}</div>;

  const update = <Key extends keyof DealerApplication>(key: Key, value: DealerApplication[Key]) => setProfile({ ...profile, [key]: value });
  return <div style={{ maxWidth: 760 }}>
    <div className="page-header"><div><h1 className="page-title">Business Profile</h1><p className="page-subtitle">Keep your dealership contact details current.</p></div></div>
    {error && <div role="alert" className="glass-card" style={{ padding: '1rem', color: 'var(--color-error)', marginBottom: '1rem' }}>{error}</div>}
    {message && <div role="status" className="glass-card" style={{ padding: '1rem', color: 'var(--color-success)', marginBottom: '1rem' }}>{message}</div>}
    <form onSubmit={saveProfile} className="glass-card" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <label className="form-group"><span className="form-label">Business name</span><input className="form-input" value={profile.businessName} onChange={(event) => update('businessName', event.target.value)} required /></label>
      <label className="form-group"><span className="form-label">Representative</span><input className="form-input" value={profile.representativeName} onChange={(event) => update('representativeName', event.target.value)} required /></label>
      <label className="form-group"><span className="form-label">Phone</span><input className="form-input" value={profile.phone} onChange={(event) => update('phone', event.target.value)} required /></label>
      <label className="form-group"><span className="form-label">Business email</span><input type="email" className="form-input" value={profile.businessEmail} onChange={(event) => update('businessEmail', event.target.value)} required /></label>
      <label className="form-group"><span className="form-label">Business phone</span><input className="form-input" value={profile.businessPhone} onChange={(event) => update('businessPhone', event.target.value)} required /></label>
      <label className="form-group"><span className="form-label">Website</span><input type="url" className="form-input" value={profile.website ?? ''} onChange={(event) => update('website', event.target.value || null)} /></label>
      <label className="form-group"><span className="form-label">City</span><input className="form-input" value={profile.city} onChange={(event) => update('city', event.target.value)} required /></label>
      <label className="form-group"><span className="form-label">Province</span><input className="form-input" value={profile.province} onChange={(event) => update('province', event.target.value)} required /></label>
      <label className="form-group" style={{ gridColumn: '1 / -1' }}><span className="form-label">Address</span><input className="form-input" value={profile.address} onChange={(event) => update('address', event.target.value)} required /></label>
      <label className="form-group" style={{ gridColumn: '1 / -1' }}><span className="form-label">Business description</span><textarea className="form-textarea" rows={4} value={profile.description} onChange={(event) => update('description', event.target.value)} required /></label>
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}><button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save profile'}</button></div>
    </form>
  </div>;
};
