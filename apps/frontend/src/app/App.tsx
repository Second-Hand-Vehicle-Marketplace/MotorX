import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { PortalRedirect } from '../features/auth/components/PortalRedirect';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { RoleGuard } from '../features/auth/components/RoleGuard';
import { useAuth } from '../features/auth/hooks/useAuth';

function Portal({ title }: { title: string }) {
  const { localUser, logout } = useAuth();
  return <main><h1>{title}</h1><p>Signed in as {localUser?.email}</p><button onClick={() => void logout()}>Sign out</button><Outlet /></main>;
}

export function App() {
  return <BrowserRouter><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<PortalRedirect />} />
      <Route element={<RoleGuard roles={['buyer', 'dealer', 'admin']} />}>
        <Route path="/marketplace" element={<Portal title="MotorX Marketplace" />} />
      </Route>
      <Route element={<RoleGuard roles={['dealer']} />}>
        <Route path="/dealer/*" element={<Portal title="Dealer Portal" />} />
      </Route>
      <Route element={<RoleGuard roles={['admin']} />}>
        <Route path="/admin/*" element={<Portal title="Admin Portal" />} />
      </Route>
    </Route>
    <Route path="*" element={<PortalRedirect />} />
  </Routes></BrowserRouter>;
}
