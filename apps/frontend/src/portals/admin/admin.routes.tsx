export const adminRoutes = [
	{
		path: '/admin',
		page: 'AdminDashboard',
	},
	{
		path: '/admin/users',
		page: 'UserManagement',
	},
	{
		path: '/admin/dealers',
		page: 'DealerApprovals',
	},
	{
		path: '/admin/listings',
		page: 'ListingMonitoring',
	},
	{
		path: '/admin/uploads',
		page: 'UploadMonitoring',
	},
	{
		path: '/admin/audit-logs',
		page: 'AuditLogs',
	},
	{
		path: '/admin/system-health',
		page: 'SystemHealth',
	},
] as const;