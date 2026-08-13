import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginForm() {
  const { login, register, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    try {
      if (registering) await register(email, password, displayName);
      else await login(email, password);
      navigate('/', { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
    }
  }

  async function reset() {
    if (!email) return setMessage('Enter your email address first.');
    try { await resetPassword(email); setMessage('Password reset email sent.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not send reset email.'); }
  }

  return <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
    {registering && <input aria-label="Display name" autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" maxLength={120} />}
    <input aria-label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
    <input aria-label="Password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
    <button type="submit">{registering ? 'Create account' : 'Sign in'}</button>
    <button type="button" onClick={() => setRegistering((value) => !value)}>{registering ? 'Use existing account' : 'Create an account'}</button>
    {!registering && <button type="button" onClick={reset}>Forgot password?</button>}
    {message && <p role="alert">{message}</p>}
  </form>;
}
