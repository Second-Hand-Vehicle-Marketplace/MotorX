import { buyerRoutes } from '../portals/buyer/buyer.routes';
import { adminRoutes } from '../portals/admin/admin.routes';
import { dealerRoutes } from '../portals/dealer/dealer.routes';

export const router = {
	publicRoutes: buyerRoutes,
	protectedRoutes: {
		guard: 'ProtectedRoute',
		routes: [...dealerRoutes, ...adminRoutes],
	},
} as const;