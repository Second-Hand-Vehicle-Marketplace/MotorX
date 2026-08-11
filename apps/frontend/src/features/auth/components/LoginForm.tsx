import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '../types/auth.types';

export const LoginForm: React.FC = () => {
  const { login, loginAsRole } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');

    try {
      await login(email, password);
      navigate('/marketplace');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to sign in right now.';
      setError(message);
    }
  };

  const handleQuickDemoRole = (role: UserRole) => {
    loginAsRole(role);
    if (role === 'dealer') navigate('/dealer');
    else if (role === 'admin') navigate('/admin');
    else navigate('/marketplace');
  };

  return (
    <div className="glass-card" style={{ padding: '2.5rem', maxWidth: 440, width: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Welcome to MotorX</h2>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>
          Buyers can browse without signing in. Dealers must register and wait for approval.
        </p>
      </div>

      {error && (
        <div className="glass-card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderColor: 'var(--color-error)' }}>
          <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', textAlign: 'left' }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '0.5rem', width: '100%' }}>
          Sign In
        </button>
      </form>

      <div style={{ margin: '2rem 0 1.5rem', position: 'relative', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid var(--color-glass-border)' }} />
        <span style={{ position: 'relative', background: 'var(--color-bg-secondary)', padding: '0 0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Quick Demo Accounts
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => handleQuickDemoRole('buyer')}
          className="btn btn-secondary btn-sm"
          style={{ flexDirection: 'column', padding: '0.75rem 0.5rem', gap: '0.25rem' }}
        >
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Buyer</span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>Browse marketplace</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickDemoRole('dealer')}
          className="btn btn-secondary btn-sm"
          style={{ flexDirection: 'column', padding: '0.75rem 0.5rem', gap: '0.25rem' }}
        >
          <span style={{ fontWeight: 600, color: 'var(--color-accent-light)' }}>Dealer</span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>Manage listings</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickDemoRole('admin')}
          className="btn btn-secondary btn-sm"
          style={{ flexDirection: 'column', padding: '0.75rem 0.5rem', gap: '0.25rem' }}
        >
          <span style={{ fontWeight: 600, color: 'var(--color-amber)' }}>Admin</span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>System control</span>
        </button>
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: 'var(--radius-lg)', background: 'var(--color-accent-subtle)', border: '1px solid var(--color-glass-border)' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
          Want to upload inventory? Register as a Dealer.
        </p>
        <button type="button" onClick={() => navigate('/dealer/register')} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
          Go to Dealer Sign-Up
        </button>
      </div>
    </div>
  );
};