import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from './providers';

// Auth
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { DealerPendingPage } from '../features/auth/pages/DealerPendingPage';
import { RoleGuard } from '../features/auth/components/RoleGuard';

// Portals
import { BuyerLayout } from '../portals/buyer/layout/BuyerLayout';
import { Marketplace } from '../portals/buyer/pages/Marketplace';
import { VehicleDetails } from '../portals/buyer/pages/VehicleDetails';

import { DealerLayout } from '../portals/dealer/layout/DealerLayout';
import { DealerDashboard } from '../portals/dealer/pages/DealerDashboard';
import { ListingManager } from '../portals/dealer/pages/ListingManager';
import { ListingForm } from '../portals/dealer/pages/ListingForm';
import { InventoryUpload } from '../portals/dealer/pages/InventoryUpload';
import { UploadDetails } from '../portals/dealer/pages/UploadDetails';

import { AdminLayout } from '../portals/admin/layout/AdminLayout';
import { AdminDashboard } from '../portals/admin/pages/AdminDashboard';
import { UserManagement } from '../portals/admin/pages/UserManagement';
import { DealerApprovals } from '../portals/admin/pages/DealerApprovals';
import { ListingMonitoring } from '../portals/admin/pages/ListingMonitoring';
import { UploadMonitoring } from '../portals/admin/pages/UploadMonitoring';
import { AuditLogs } from '../portals/admin/pages/AuditLogs';
import { SystemHealth } from '../portals/admin/pages/SystemHealth';

import { LandingPage } from './LandingPage';

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
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
              <Route path="/admin/system-health" element={<SystemHealth />} />
            </Route>
          </Route>

          {/* Fallback Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}
