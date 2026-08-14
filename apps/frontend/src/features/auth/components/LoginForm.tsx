import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');

    try {
      const authenticatedUser = await login(email, password);
      const destination = authenticatedUser.role === 'admin'
        ? '/admin'
        : authenticatedUser.role === 'dealer'
          ? '/dealer'
          : '/marketplace';
      navigate(destination);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to sign in right now.';
      setError(message);
    }
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

    </div>
  );
};