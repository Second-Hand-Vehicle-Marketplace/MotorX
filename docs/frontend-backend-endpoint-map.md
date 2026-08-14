# Frontend Backend Endpoint Map

This document maps the current TypeScript frontend to the backend endpoints your team should implement.

The rule is simple: the frontend talks to service files, and the service files talk to the backend.
The frontend should not talk directly to MongoDB, Firebase, or S3.

## Shared Rules

- All backend endpoints should return JSON.
- All protected endpoints should accept `Authorization: Bearer <firebase-id-token>`.
- Listing images should come back as real S3 URLs.
- CSV files should be uploaded to the backend, then stored in S3 by the backend.
- The frontend may keep mock fallback behavior until the backend is ready.

## Authentication

### UI area

- Login page and auth context
- File: [apps/frontend/src/features/auth/context/AuthProvider.tsx](../apps/frontend/src/features/auth/context/AuthProvider.tsx)
- File: [apps/frontend/src/features/auth/services/authApi.ts](../apps/frontend/src/features/auth/services/authApi.ts)

### Backend endpoints

- `GET /api/v1/auth/me`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`

### Backend should provide

- Verify the Firebase token.
- Load or create the local user document in MongoDB.
- Return the user role, approval state, and profile fields.

### UI depends on

- Navbar sign-in state
- Role switching for buyer, dealer, admin previews
- Protected route checks

### Notes

- Until Firebase is wired, the frontend can keep demo auth in the provider.
- After Firebase is connected, replace demo auth with backend user lookups.

## Buyer Marketplace

### UI area

- Marketplace page
- Vehicle details page
- Files: [apps/frontend/src/portals/buyer/pages/Marketplace.tsx](../apps/frontend/src/portals/buyer/pages/Marketplace.tsx)
- File: [apps/frontend/src/portals/buyer/pages/VehicleDetails.tsx](../apps/frontend/src/portals/buyer/pages/VehicleDetails.tsx)
- File: [apps/frontend/src/features/listings/services/listingApi.ts](../apps/frontend/src/features/listings/services/listingApi.ts)

### Backend endpoints

- `GET /api/v1/listings`
- `GET /api/v1/listings/:id`

### Request data

- Search text
- Make
- Body type
- Fuel type
- Price range
- Sort order
- Pagination

### Backend should provide

- Paginated marketplace listings from MongoDB.
- Full listing details for one listing.
- Real image URLs from S3.
- Dealer name, vehicle specs, pricing, views, and created date.

### UI depends on

- Listing cards
- Filter sidebar
- Pagination controls
- Vehicle detail gallery

## Dealer Listings

### UI area

- Dealer dashboard
- Manage inventory
- Add listing form
- Files: [apps/frontend/src/portals/dealer/pages/DealerDashboard.tsx](../apps/frontend/src/portals/dealer/pages/DealerDashboard.tsx)
- File: [apps/frontend/src/portals/dealer/pages/ListingManager.tsx](../apps/frontend/src/portals/dealer/pages/ListingManager.tsx)
- File: [apps/frontend/src/portals/dealer/pages/ListingForm.tsx](../apps/frontend/src/portals/dealer/pages/ListingForm.tsx)

### Backend endpoints

- `GET /api/v1/dealer/listings`
- `POST /api/v1/dealer/listings`
- `PATCH /api/v1/dealer/listings/:id`
- `DELETE /api/v1/dealer/listings/:id`

### Backend should provide

- Only the signed-in dealer's own listings.
- Create and update listing documents in MongoDB.
- Ownership checks so one dealer cannot edit another dealer's data.
- Listing status, views, leads, and timestamps.

### UI depends on

- Dealer dashboard summary cards
- Inventory table
- Create listing form submit

## Listing Images

### UI area

- Listing form and detail gallery
- Files: [apps/frontend/src/features/listings/components/ListingGallery.tsx](../apps/frontend/src/features/listings/components/ListingGallery.tsx)
- File: [apps/frontend/src/features/listings/components/ListingCard.tsx](../apps/frontend/src/features/listings/components/ListingCard.tsx)

### Backend endpoints

- `POST /api/v1/dealer/listings/:id/images`
- or `POST /api/v1/uploads/presign` if you use presigned S3 uploads

### Backend should provide

- Image validation for MIME type, extension, and size.
- S3 upload and storage.
- Returned image metadata with `id`, `url`, `alt`, and `isPrimary`.

### UI depends on

- Real gallery images in marketplace and details page
- Primary image preview in listing cards

## CSV Uploads

### UI area

- Inventory upload page
- Upload details page
- Files: [apps/frontend/src/portals/dealer/pages/InventoryUpload.tsx](../apps/frontend/src/portals/dealer/pages/InventoryUpload.tsx)
- File: [apps/frontend/src/portals/dealer/pages/UploadDetails.tsx](../apps/frontend/src/portals/dealer/pages/UploadDetails.tsx)

### Backend endpoints

- `POST /api/v1/dealer/uploads`
- `GET /api/v1/dealer/uploads`
- `GET /api/v1/dealer/uploads/:id`

### Backend should provide

- Store the raw CSV file in S3.
- Create an upload job record in MongoDB.
- Send the job to the worker for parsing and ETL.
- Return processing state, counts, and rejected rows.

### UI depends on

- Upload history list
- Processing status badges
- Rejected row details

## Admin Screens

### UI area

- Admin dashboard
- User management
- Dealer approvals
- Listing monitoring
- Upload monitoring
- System health
- Files: [apps/frontend/src/portals/admin/pages/AdminDashboard.tsx](../apps/frontend/src/portals/admin/pages/AdminDashboard.tsx)
- File: [apps/frontend/src/portals/admin/pages/UserManagement.tsx](../apps/frontend/src/portals/admin/pages/UserManagement.tsx)
- File: [apps/frontend/src/portals/admin/pages/DealerApprovals.tsx](../apps/frontend/src/portals/admin/pages/DealerApprovals.tsx)
- File: [apps/frontend/src/portals/admin/pages/ListingMonitoring.tsx](../apps/frontend/src/portals/admin/pages/ListingMonitoring.tsx)
- File: [apps/frontend/src/portals/admin/pages/UploadMonitoring.tsx](../apps/frontend/src/portals/admin/pages/UploadMonitoring.tsx)
- File: [apps/frontend/src/portals/admin/pages/SystemHealth.tsx](../apps/frontend/src/portals/admin/pages/SystemHealth.tsx)

### Backend endpoints

- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:id`
- `GET /api/v1/admin/dealers`
- `PATCH /api/v1/admin/dealers/:id/approve`
- `PATCH /api/v1/admin/dealers/:id/reject`
- `GET /api/v1/admin/listings`
- `DELETE /api/v1/admin/listings/:id`
- `GET /api/v1/admin/uploads`
- `GET /api/v1/admin/system-health`

### Backend should provide

- Moderation data from MongoDB.
- Dealer approval workflow.
- User suspension and activation.
- Health status for backend, database, queue, and worker.

## Suggested Frontend Transition Plan

1. Keep the current UI and replace mock data service by service.
2. Make backend return the same shapes that the frontend already expects.
3. Switch auth from demo mode to Firebase token verification.
4. Replace mock listing images with S3 URLs.
5. Replace CSV mock jobs with real upload job APIs.

## What Your Friend Should Build First

1. Auth `me` endpoint and Firebase verification middleware.
2. Listings `GET` endpoints.
3. Dealer listing create/update endpoints.
4. S3 image upload endpoint.
5. CSV upload job endpoint.

If these five exist, the current UI can start using real backend data with minimal code changes.