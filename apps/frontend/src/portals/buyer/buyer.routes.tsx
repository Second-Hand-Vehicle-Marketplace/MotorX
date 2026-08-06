export const buyerRoutes = [
	{
		path: '/marketplace',
		page: 'Marketplace',
	},
	{
		path: '/marketplace/:listingId',
		page: 'VehicleDetails',
	},
] as const;