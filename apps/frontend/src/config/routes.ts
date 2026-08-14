export const routes = {
  home: '/',
  login: '/login',
  signup: '/signup',
  marketplace: '/marketplace',
  vehicleDetails: (id: string) => `/marketplace/${id}`,
  
  // Dealer portal
  dealerDashboard: '/dealer',
  dealerApply: '/dealer/apply',
  dealerApplicationStatus: '/dealer/application-status',
  dealerListings: '/dealer/listings',
  dealerNewListing: '/dealer/listings/new',
  dealerUploads: '/dealer/uploads/new',
  dealerUploadDetails: (id: string) => `/dealer/uploads/${id}`,

  // Admin portal
  adminDashboard: '/admin',
  adminUsers: '/admin/users',
  adminDealers: '/admin/dealers',
  adminListings: '/admin/listings',
  adminUploads: '/admin/uploads',
  adminAuditLogs: '/admin/audit-logs',
  adminSystemHealth: '/admin/system-health',
} as const;
