export const dealerRoutes = [
	{
		path: '/dealer',
		page: 'DealerDashboard',
	},
	{
		path: '/dealer/uploads/new',
		page: 'InventoryUpload',
	},
	{
		path: '/dealer/uploads/:uploadId',
		page: 'UploadDetails',
	},
	{
		path: '/dealer/listings',
		page: 'ListingManager',
	},
	{
		path: '/dealer/listings/new',
		page: 'ListingForm',
	},
] as const;