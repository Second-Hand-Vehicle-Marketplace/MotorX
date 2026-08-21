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

Buyer-facing (public, no auth) and dealer-facing (authenticated, `requireRole('dealer')`) routes
are both mounted at `/api/v1/listings`. `listingRouter` (dealer routes) is registered before
`buyerRouter` — this ordering matters: `buyerRouter`'s public `GET /:listingId` would otherwise
shadow `listingRouter`'s `GET /mine`, matching the literal string `"mine"` as if it were a listing
id. See `apps/backend/src/app.ts`.

- `GET /api/v1/listings` — public marketplace browse. Supports `page`, `limit`, `search`, `make`,
  `model`, `category`, `bodyType`, `condition`, `fuelType`, `transmission`, `yearMin`/`yearMax`,
  `priceMin`/`priceMax`, `sortBy`. Only `status: active` listings are returned.
- `GET /api/v1/listings/:id` — one active listing, including the owning dealer's public profile
  (`dealer: { businessName, location, phone, email, description, website }` or `null`).
- `GET /api/v1/listings/mine` — the signed-in dealer's own listings, any status. Dealer-only.
- `POST /api/v1/listings` — creates a listing for the signed-in dealer. Body validated against
  `commonListingFieldsSchema` intersected with the category-discriminated `vehicleDetailsSchema`
  (both from `@motorx/shared-contracts`) — see "Vehicle Categories" below. Dealer-only.
- `PATCH /api/v1/listings/:id` — updates a dealer-owned listing. `category` is immutable; a
  partial `attributes` patch is merged onto the listing's existing attributes and re-validated
  against that category's schema before saving. Dealer-only, ownership-checked.
- `PATCH /api/v1/listings/:id/status` — moves a listing through `draft → active/archived →
  sold/archived`. Reactivating a `sold` listing re-checks the registration-number duplicate rule
  (another listing may have claimed the same plate number while this one was sold). Dealer-only.
- `POST /api/v1/listings/:id/images`, `DELETE /api/v1/listings/:id/images/:imageKey`,
  `PATCH /api/v1/listings/:id/images/reorder` — dealer-only, ownership-checked.

Expected backend behavior:

- Store listing documents in MongoDB (see [database.md](./database.md) for the full schema).
- Return real image URLs from S3, not frontend-generated placeholders.
- Enforce ownership so one dealer cannot edit another dealer's inventory.
- Reject creating or reactivating a listing whose `registrationNumber` already belongs to another
  currently `draft`/`active` listing (409); archived/sold listings never block a relist.

### Vehicle Categories

A listing's `category` (`car | motorcycle | van | truck | three_wheeler | bus | other`) determines
the shape of its `attributes` object. The conditional fuel-type rules — an engine capacity is
required for petrol/diesel/hybrid/plug_in_hybrid, battery capacity + range are required for
electric/plug_in_hybrid — are enforced once, in `@motorx/shared-contracts`'s
`vehicleDetailsSchema`, and reused by both the manual listing form (backend) and the CSV pipeline
(worker), so the two entry points can never validate a vehicle differently. See
[database.md](./database.md#attributes-by-category) for the full field list per category.

### Images

- `POST /api/v1/dealer/listings/:id/images` uploads listing images.
- The backend should accept multipart form data or presigned upload metadata.
- The backend should validate MIME type, extension, size, and ownership before saving to S3.

Expected response:

- `images[]` entries should include `id`, `url`, `alt`, and `isPrimary`.

### CSV Uploads

All routes below require dealer auth and are mounted at `/api/v1/dealer/uploads`.
`GET /template/:category` is registered before `GET /:uploadId` for the same reason
`listingRouter` is registered before `buyerRouter` above — a param route would otherwise treat
`"template"` as an upload id.

- `GET /api/v1/dealer/uploads/template/:category` — downloads a CSV template (headers + one
  filled-in example row) for the given category, generated from
  `csvTemplatesByCategory` in `@motorx/shared-contracts` — the same config also drives the
  dealer-facing field guide table, so the template and its documentation can't drift apart.
- `POST /api/v1/dealer/uploads` — multipart: a `category` field plus the CSV `file`. Validates
  that the CSV's header row contains every column that category's rows structurally require
  (`inventory.validation.ts`'s `requiredHeadersByCategory`) before storing the file in S3 and
  enqueueing the job. Category-conditional columns (e.g. `engineCapacityCc` only for combustion
  fuel types) are enforced per-row later by the shared Zod schema, not at this structural check.
- `GET /api/v1/dealer/uploads` — the dealer's upload history.
- `GET /api/v1/dealer/uploads/:id` — one upload job's status and counters.
- `GET /api/v1/dealer/uploads/:id/rejected-records` — the rejected rows for one upload, each with
  its original CSV data, row number, and validation errors.

Expected backend/worker behavior:

- Save raw CSV files in S3; create an upload-job record (with `category`) in MongoDB.
- The worker downloads the CSV, then per row: normalize → validate against the category's shared
  Zod schema → check for a duplicate `registrationNumber` (against both currently listed inventory
  and other rows already accepted earlier in the same file) → persist as a `draft` listing or a
  rejected record.
- A row's `registrationNumber` — not `title`/`make`/`model`/`year` — is the duplicate-detection
  identity; it is a much stronger signal that two rows describe the same physical vehicle.

### Admin

- `GET /api/v1/admin/users` returns user management data.
- `GET /api/v1/admin/dealers` returns dealer approvals.
- `GET /api/v1/admin/listings` returns moderated listing data. Supports `search`, `status`, and `category` filters.
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
