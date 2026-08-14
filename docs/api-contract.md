# API Contract

All endpoints should use a consistent success and error envelope.

## Frontend Connection Points

These are the places the frontend should call the backend instead of reading mock data directly:

- Authentication: [apps/frontend/src/features/auth/services/authApi.ts](../apps/frontend/src/features/auth/services/authApi.ts)
- Auth state: [apps/frontend/src/features/auth/context/AuthProvider.tsx](../apps/frontend/src/features/auth/context/AuthProvider.tsx)
- Listings: [apps/frontend/src/features/listings/services/listingApi.ts](../apps/frontend/src/features/listings/services/listingApi.ts)
- API client: [apps/frontend/src/shared/services/apiClient.ts](../apps/frontend/src/shared/services/apiClient.ts)

Authentication and dealer approvals use the backend as their only source of truth; they do not fall back to browser mock data.

## Recommended API Surface

### Auth

- `GET /api/v1/auth/me` returns the current user after Firebase token verification.
- `PATCH /api/v1/auth/me` stores the authenticated user's display name and phone number.

Expected backend behavior:

- Verify the Firebase ID token from the `Authorization: Bearer <token>` header.
- Find or create the local user document in MongoDB.
- Return the user profile, role, and approval status.

### Dealer Applications

- `POST /api/v1/dealers/applications` accepts multipart form data from a newly authenticated buyer account.
- `GET /api/v1/dealers/me` returns the current user's application, including pending/rejected status and review reason.
- `GET /api/v1/admin/dealer-applications` returns pending applications to administrators.
- `GET /api/v1/admin/dealer-applications/:dealerId/documents/:documentIndex` streams a protected verification document to an administrator.
- `PATCH /api/v1/admin/dealer-applications/:dealerId/approve` approves an application and atomically promotes the user to the dealer role.
- `PATCH /api/v1/admin/dealer-applications/:dealerId/reject` stores the rejection reason, reviewer, and review date.

The multipart application requires `businessRegistration` and `identityProof` files. `additionalDocument` is optional. Files must be PDF, JPG, or PNG and no larger than 10 MB each.

### Listings

- `GET /api/v1/listings` returns public marketplace listings with pagination and filters.
- `GET /api/v1/listings/:id` returns one vehicle listing with full details.
- `POST /api/v1/dealer/listings` creates a listing for the signed-in dealer.
- `PATCH /api/v1/dealer/listings/:id` updates a dealer-owned listing.
- `DELETE /api/v1/dealer/listings/:id` removes a dealer-owned listing.

Expected backend behavior:

- Store listing documents in MongoDB.
- Return real image URLs from S3, not frontend-generated placeholders.
- Enforce ownership so one dealer cannot edit another dealer's inventory.

### Images

- `POST /api/v1/dealer/listings/:id/images` uploads listing images.
- The backend should accept multipart form data or presigned upload metadata.
- The backend should validate MIME type, extension, size, and ownership before saving to S3.

Expected response:

- `images[]` entries should include `id`, `url`, `alt`, and `isPrimary`.

### CSV Uploads

- `POST /api/v1/dealer/uploads` creates a CSV upload job and stores the file in S3.
- `GET /api/v1/dealer/uploads` returns the dealer's upload history.
- `GET /api/v1/dealer/uploads/:id` returns upload status and rejected rows.

Expected backend behavior:

- Save raw CSV files in S3.
- Create an upload-job record in MongoDB.
- Let the worker read the CSV from storage and produce listings + rejected rows.

### Admin

- `GET /api/v1/admin/users` returns user management data.
- `GET /api/v1/admin/dealers` returns dealer approvals.
- `GET /api/v1/admin/listings` returns moderated listing data.
- `GET /api/v1/admin/uploads` returns upload monitoring data.
- `GET /api/v1/admin/system-health` returns service health for the dashboard.

## Health Routes

- `GET /health/live` confirms the API process is up.
- `GET /health/ready` confirms the API can reach its required dependencies.
- `GET /health` returns operational status for backend, database, queue, and ETL worker.
- `GET /api/v1/admin/system-health` returns protected operational details for administrators.

## Authentication Flow

- Firebase authentication happens first.
- Backend middleware verifies the Firebase token, then `loadLocalUser.ts` loads or creates the local user document.

Frontend note:

- Public sign-up always creates a buyer. There is no public admin-registration path.
- A dealer applicant keeps the buyer role while pending or rejected and therefore cannot pass backend dealer-role middleware.
- Approval updates the local role to `dealer`; the user signs in again to refresh access to the dealer portal.

## Validation

- Zod is the shared validation library for request schemas and runtime validation rules.

## Image Uploads

- Dealers upload listing images through the backend using multipart form data.
- The backend validates MIME type, extension, size, and ownership before writing to S3-compatible storage.
- The stored listing document keeps image metadata, not arbitrary frontend-provided public URLs.

Frontend note:

- The frontend should send the file to the backend, then render the returned S3 URL.
- Do not hardcode image URLs in the UI once the backend is connected.

## Notifications

- The ETL worker creates the inventory notification document.
- The same worker may send the optional completion email and record `emailStatus`.
