import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from './providers';

// Auth
import { RoleGuard } from '../features/auth/components/RoleGuard';

// Portals
const LoginPage = React.lazy(() => import('../features/auth/pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = React.lazy(() => import('../features/auth/pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const DealerPendingPage = React.lazy(() => import('../features/auth/pages/DealerPendingPage').then((module) => ({ default: module.DealerPendingPage })));
const BuyerLayout = React.lazy(() => import('../portals/buyer/layout/BuyerLayout').then((module) => ({ default: module.BuyerLayout })));
const Marketplace = React.lazy(() => import('../portals/buyer/pages/Marketplace').then((module) => ({ default: module.Marketplace })));
const VehicleDetails = React.lazy(() => import('../portals/buyer/pages/VehicleDetails').then((module) => ({ default: module.VehicleDetails })));
const DealerLayout = React.lazy(() => import('../portals/dealer/layout/DealerLayout').then((module) => ({ default: module.DealerLayout })));
const DealerDashboard = React.lazy(() => import('../portals/dealer/pages/DealerDashboard').then((module) => ({ default: module.DealerDashboard })));
const ListingManager = React.lazy(() => import('../portals/dealer/pages/ListingManagerEnhanced').then((module) => ({ default: module.ListingManagerEnhanced })));
const ListingForm = React.lazy(() => import('../portals/dealer/pages/ListingForm').then((module) => ({ default: module.ListingForm })));
const DealerProfile = React.lazy(() => import('../portals/dealer/pages/DealerProfile').then((module) => ({ default: module.DealerProfile })));
const InventoryUpload = React.lazy(() => import('../portals/dealer/pages/InventoryUpload').then((module) => ({ default: module.InventoryUpload })));
const UploadDetails = React.lazy(() => import('../portals/dealer/pages/UploadDetails').then((module) => ({ default: module.UploadDetails })));
const AdminLayout = React.lazy(() => import('../portals/admin/layout/AdminLayout').then((module) => ({ default: module.AdminLayout })));
const AdminDashboard = React.lazy(() => import('../portals/admin/pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const UserManagement = React.lazy(() => import('../portals/admin/pages/UserManagement').then((module) => ({ default: module.UserManagement })));
const DealerApprovals = React.lazy(() => import('../portals/admin/pages/DealerApprovals').then((module) => ({ default: module.DealerApprovals })));
const ListingMonitoring = React.lazy(() => import('../portals/admin/pages/ListingMonitoring').then((module) => ({ default: module.ListingMonitoring })));
const UploadMonitoring = React.lazy(() => import('../portals/admin/pages/UploadMonitoring').then((module) => ({ default: module.UploadMonitoring })));
const AuditLogs = React.lazy(() => import('../portals/admin/pages/AuditLogs').then((module) => ({ default: module.AuditLogs })));
const LandingPage = React.lazy(() => import('./LandingPage').then((module) => ({ default: module.LandingPage })));

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Suspense fallback={<div role="status" aria-label="Loading page" className="loading-spinner" style={{ display: 'block', margin: '4rem auto' }} />}>
          <Routes>
            {/* Auth Route */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<RegisterPage mode="buyer" />} />
            <Route path="/buyer/register" element={<RegisterPage mode="buyer" />} />
            <Route path="/dealer/apply" element={<RegisterPage mode="dealer" />} />
            <Route path="/dealer/register" element={<RegisterPage mode="dealer" />} />
            <Route path="/dealer/pending" element={<DealerPendingPage />} />
            <Route path="/dealer/application-status" element={<DealerPendingPage />} />

            {/* Public Buyer Routes (with Buyer Header/Footer Layout) */}
            <Route element={<BuyerLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/:listingId" element={<VehicleDetails />} />
            </Route>

            {/* Protected Dealer Portal Routes */}
            <Route element={<RoleGuard allowedRoles={['dealer', 'admin']} />}>
              <Route element={<DealerLayout />}>
                <Route path="/dealer" element={<DealerDashboard />} />
                <Route path="/dealer/listings" element={<ListingManager />} />
                <Route path="/dealer/listings/new" element={<ListingForm />} />
                <Route path="/dealer/listings/:listingId/edit" element={<ListingForm />} />
                <Route path="/dealer/profile" element={<DealerProfile />} />
                <Route path="/dealer/uploads/new" element={<InventoryUpload />} />
                <Route path="/dealer/uploads/:uploadId" element={<UploadDetails />} />
              </Route>
            </Route>

            {/* Protected Admin Console Routes */}
            <Route element={<RoleGuard allowedRoles={['admin']} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/dealers" element={<DealerApprovals />} />
                <Route path="/admin/listings" element={<ListingMonitoring />} />
                <Route path="/admin/uploads" element={<UploadMonitoring />} />
                <Route path="/admin/audit-logs" element={<AuditLogs />} />
              </Route>
            </Route>

            {/* Fallback Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProviders>
  );
}
