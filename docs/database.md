# Database

MongoDB Atlas is the primary persistent store. Collections are named in plural lowercase form and
indexed with readable compound names. The backend and the ETL worker each define their own
Mongoose models against the same collections (the worker intentionally owns lightweight copies of
`listings` and `uploadJobs` rather than importing the backend's models — see
[architecture.md](./architecture.md)), so a schema change to a shared collection must be applied in
both places.

## `users`

Local user profile created on first Firebase sign-in (see `loadLocalUser` middleware).

| Field | Type | Notes |
|---|---|---|
| `firebaseUid` | string | Unique, links to the Firebase Authentication identity |
| `email`, `displayName`, `phone` | string | |
| `role` | `buyer \| dealer \| admin` | Starts `buyer`; becomes `dealer` only after admin approval |
| `status` | `active \| pending \| suspended` | `suspended` blocks `requireAuthenticated` |

## `dealers`

A dealer's business profile and application review state.

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId (unique) | The owning `users` document |
| `businessName`, `registrationNumber`, `phone`, `address`, `representativeName`, `city`, `province`, `businessPhone`, `businessEmail`, `website?`, `description` | string | Business registration number — unrelated to a vehicle's registration number below |
| `dealershipType` | `new \| used \| both` | |
| `brands` | string[] | |
| `verificationDocuments` | array | `{ category, key, originalName, contentType, size }` |
| `status` | `pending \| approved \| rejected` | |
| `reviewedBy`, `reviewedAt`, `rejectionReason?` | | Set on admin review |

## `listings`

A vehicle listing. Every category shares one set of common fields; everything category-specific
lives inside `attributes`, whose shape is discriminated by `category` (see
`VehicleDetails` in `packages/shared-contracts/src/vehicle/index.ts`).

| Field | Type | Notes |
|---|---|---|
| `dealerId` | ObjectId | References `users` (not `dealers`) |
| `sourceUploadJobId?` | ObjectId | Set when the listing came from a bulk CSV import |
| `registrationNumber` | string | Trimmed, uppercased vehicle registration/plate number, e.g. `CAX-1234` |
| `normalizedRegistrationNumber` | string | `normalizeRegistrationNumber()` result (spaces/hyphens stripped, uppercased) — indexed, used for duplicate detection, never shown to buyers |
| `title`, `make`, `model`, `year`, `price`, `currency`, `location`, `description?` | | Common to every category |
| `category` | `car \| motorcycle \| van \| truck \| three_wheeler \| bus \| other` | Immutable after creation |
| `attributes` | Mixed | Category-specific fields (see below); validated by the shared Zod schemas before ever reaching Mongoose, so the schema field itself is intentionally loose |
| `images` | array | `{ key, url, alt?, order }` |
| `status` | `draft \| active \| sold \| archived` | Lifecycle enforced in `listing.service.ts` |
| `publishedAt?` | Date | Set the first time a listing becomes `active` |

### `attributes` by category

All powertrain-bearing categories (everything except `other`) share these fields, with
conditional requirements enforced by the shared Zod schemas based on `fuelType`:
`fuelType`, `transmission`, `engineCapacityCc?` (required for petrol/diesel/hybrid/plug_in_hybrid),
`batteryCapacityKWh?` and `batteryRangeKm?` (both required for electric/plug_in_hybrid),
`condition`, `mileageKm`.

| Category | Extra fields |
|---|---|
| `car` | `edition?`, `bodyType` (required) |
| `motorcycle` | `edition?`, `bikeType` (required) |
| `van` | `edition?`, `seatingCapacity?` |
| `truck` | `edition?`, `payloadCapacityKg?` |
| `three_wheeler` | none |
| `bus` | `seatingCapacity?` |

### Duplicate detection

A `registrationNumber` is not globally unique in the schema — an archived or sold listing's plate
number can be reused by a new listing (the vehicle was legitimately resold). Instead,
`findActiveListingByRegistration` blocks creating/reactivating a listing only when another
`draft`/`active` listing already holds the same `normalizedRegistrationNumber`.

### Indexes

`status_publishedAt_id`, `dealerId_status_createdAt`, `make_model_year`, `sourceUploadJobId` (sparse),
`category_status`, `normalizedRegistrationNumber` (not unique — see above).

## `uploadjobs`

One CSV bulk-upload attempt.

| Field | Type | Notes |
|---|---|---|
| `dealerId` | ObjectId | |
| `category` | `VehicleCategory` | Chosen by the dealer before upload; determines which CSV template/validation schema the worker applies to every row |
| `fileName`, `fileSize`, `storageKey` | | `storageKey` points at the object in S3/MinIO |
| `status` | `pending \| processing \| completed \| completedWithErrors \| failed` | |
| `totalRecords`, `processedRecords`, `validRecords`, `rejectedRecords`, `duplicateRecords` | number | |
| `failureReason?`, `completedAt?` | | |

## `rejectedrecords`

One row that failed validation or was detected as a duplicate during a CSV import.

| Field | Type | Notes |
|---|---|---|
| `uploadJobId` | ObjectId | |
| `rowNumber` | number | 1-based CSV row, for the dealer to locate and fix |
| `originalData` | Mixed | The raw CSV row as extracted, before normalization |
| `errors` | string[] | Human-readable validation messages |
| `reason` | `validation \| duplicate` | |

## `adminauditlogs`

Append-only record of significant administrative actions (dealer approval/rejection, user
suspension/activation, listing removal). Written by `createAdminAuditLog`.

## `notifications`

Not yet implemented — see `apps/backend/src/modules/notifications` (currently a stub).
