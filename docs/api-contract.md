# API Contract

All endpoints should use a consistent success and error envelope.

## Frontend Connection Points

These are the places the frontend should call the backend instead of reading mock data directly:

- Authentication: [apps/frontend/src/features/auth/services/authApi.ts](../apps/frontend/src/features/auth/services/authApi.ts)
- Auth state: [apps/frontend/src/features/auth/context/AuthProvider.tsx](../apps/frontend/src/features/auth/context/AuthProvider.tsx)
- Listings: [apps/frontend/src/features/listings/services/listingApi.ts](../apps/frontend/src/features/listings/services/listingApi.ts)
- API client: [apps/frontend/src/shared/services/apiClient.ts](../apps/frontend/src/shared/services/apiClient.ts)

While the backend is still being built, these files may fall back to mock data so the UI can keep working in demo mode.

## Recommended API Surface

### Auth

- `GET /api/v1/auth/me` returns the current user after Firebase token verification.
- `POST /api/v1/auth/logout` ends the backend session if one is used.
- `POST /api/v1/auth/demo-role` is optional and only for local preview while Firebase is not wired.

Expected backend behavior:

- Verify the Firebase ID token from the `Authorization: Bearer <token>` header.
- Find or create the local user document in MongoDB.
- Return the user profile, role, and approval status.

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

- Until Firebase is wired, the UI may keep a demo login mode for local preview.
- Once Firebase is ready, the frontend should exchange the Firebase token for the backend user profile.

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
