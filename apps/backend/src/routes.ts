export const routes = {
	health: {
		live: '/health/live',
		ready: '/health/ready',
		status: '/health',
		adminSystemHealth: '/api/v1/admin/system-health',
	},
	modules: [
		'auth-users',
		'dealers',
		'marketplace',
		'inventory',
		'search',
		'notifications',
		'admin',
	],
} as const;
