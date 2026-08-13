# API Contract

All endpoints should use a consistent success and error envelope.

## Health Routes

- `GET /health/live` confirms the API process is up.
- `GET /health/ready` confirms the API can reach its required dependencies.
- `GET /health` returns operational status for backend, database, queue, and ETL worker.
- `GET /api/v1/admin/system-health` returns protected operational details for administrators.

## Authentication Flow

- Firebase authentication happens first.
- Backend middleware verifies the Firebase token, then `loadLocalUser.ts` loads or creates the local user document.

## Validation

- Zod is the shared validation library for request schemas and runtime validation rules.

## Image Uploads

- Dealers upload listing images through the backend using multipart form data.
- The backend validates MIME type, extension, size, and ownership before writing to S3-compatible storage.
- The stored listing document keeps image metadata, not arbitrary frontend-provided public URLs.

## Vehicle Listings

- `GET /api/v1/listings?page=1&limit=20` lists active vehicles with pagination metadata.
- `GET /api/v1/listings/:listingId` returns one active vehicle or `404`.
- `POST /api/v1/listings` creates a draft or active listing and requires a Firebase bearer token for an active user with the `dealer` role.
- The frontend integration functions are `getListings`, `getListing`, and `createListing` in `features/listings/services/listingApi.ts`.

## Dealer Onboarding

- `POST /api/v1/dealers/applications` lets an authenticated buyer submit one application.
- `GET /api/v1/dealers/me` returns the authenticated user's application.
- `GET /api/v1/admin/dealer-applications` lists pending applications for admins.
- `PATCH /api/v1/admin/dealer-applications/:dealerId/approve` approves an application and promotes its user to `dealer` atomically.
- `PATCH /api/v1/admin/dealer-applications/:dealerId/reject` rejects an application and requires `{ "reason": "..." }`.
- Frontend integration functions live in `features/dealers/services/dealerApi.ts`.

## Notifications

- The ETL worker creates the inventory notification document.
- The same worker may send the optional completion email and record `emailStatus`.
