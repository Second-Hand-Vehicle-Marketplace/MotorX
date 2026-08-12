import { Navigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { localUser, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (localUser) return <Navigate to="/" replace />;
  return <main><h1>MotorX</h1><h2>Sign in</h2><LoginForm /></main>;
}
