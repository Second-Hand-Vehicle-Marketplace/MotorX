# API Contract

All endpoints should use a consistent success and error envelope.

## Shared Contracts

- Any type that crosses the backend/frontend boundary — enums (roles, statuses, fuel/transmission types), DTOs (`AuthUserDto`, `DealerApplicationDto`, `ListingDto`, ...), the response envelope, and pagination metadata — is defined once in `packages/shared-contracts` and imported from `@motorx/shared-contracts`. No module redefines these locally.
- `packages/shared-contracts` is built with `npm run build --workspace @motorx/shared-contracts` before its `.d.ts` output is picked up by consumers; run this after changing `packages/shared-contracts/src`.
- The success envelope is `ApiSuccessResponse<T, M>`: `{ success: true, data: T, meta: M }` (`meta` is `null` unless the endpoint has extra metadata, e.g. `{ pagination }`). The error envelope is `ApiErrorResponse`: `{ success: false, error: { code, message }, meta: null }`.
- Backend controllers build the success envelope with `sendSuccess()` from `shared/responses/apiResponse.ts` rather than hand-writing the envelope; `errorHandler.ts` builds the error envelope.
- Frontend feature `types/*.ts` files re-export the shared DTOs (e.g. `export type Listing = ListingDto`) instead of hand-typing the same shape; Zod runtime schemas validate against the same shared enum arrays (`z.enum(fuelTypes)`, etc.) so the runtime check can't drift from the compile-time type.

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
- `GET /api/v1/listings/mine` lists all listings owned by the authenticated dealer.
- `PATCH /api/v1/listings/:listingId` updates editable fields on an authenticated dealer's own listing.
- `PATCH /api/v1/listings/:listingId/status` applies controlled publish, sold, and archive transitions to an owned listing.
- `POST /api/v1/listings/:listingId/images` accepts one multipart field named `image` and optional `alt` text.
- `DELETE /api/v1/listings/:listingId/images/:imageKey` removes owned image metadata and its S3/MinIO object.
- `PATCH /api/v1/listings/:listingId/images/reorder` accepts `{ "imageKeys": ["..."] }` containing every current key once.
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
