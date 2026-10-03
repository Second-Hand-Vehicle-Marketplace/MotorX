**MotorX file and function index**

Start with [the walkthrough](CODEBASE_WALKTHROUGH.md). This index covers 314 TypeScript/TSX/MJS source and configuration files under apps and packages, with 819 named functions, components, and methods, including local named helpers. Generated dependencies, build outputs, public binary assets, and private environment files are excluded.

Paths are relative to D:/MotorX/MotorX. Line numbers describe this working-tree snapshot and may change. Named callbacks assigned to variables are included; anonymous effect/event callbacks are part of their containing implementation, not separately named functions. Test cases are listed by their declared names. Direct calls are syntactic navigation aids, not a complete runtime call graph; calls inside nested anonymous callbacks are omitted from that list. Leading source comments are reproduced as explanations and are not independent verification.

Root configuration, infrastructure, non-JavaScript scripts, generated reports, and runtime flows are explained in the walkthrough. This includes the uncommitted admin collection/account changes from the preceding task; their presence does not establish deployment or a passing test run.

Regenerate with `node docs/generate-codebase-index.cjs`.

**[apps/backend/scripts/backfill-search-embeddings.mjs](../apps/backend/scripts/backfill-search-embeddings.mjs)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `embed` (line 16) | text | No leading explanation comment; read the linked implementation. Direct named calls: `createLocalSearchEmbedding`, `fetch`, `encodeURIComponent`, `JSON.stringify`, `text.slice`, `AbortSignal.timeout`, `normalizeEmbeddingResponse`, `response.json`. |

---

**[apps/backend/scripts/migrate-vehicle-categories.mjs](../apps/backend/scripts/migrate-vehicle-categories.mjs)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/app.ts](../apps/backend/src/app.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `app`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `checkWithin` (line 59) | check, timeoutMs | Resolves false instead of waiting when a dependency does not answer quickly: a hung Redis or MongoDB must never make the health endpoint itself hang. Direct named calls: `Promise.race`, `check`, `clearTimeout`. |

HTTP registrations (relative to the mount in `app.ts`):

- app.use("/api") — line 51
- app.get("/health/live") — line 53
- app.get("/health/ready") — line 72
- app.use("/api/v1/auth") — line 85
- app.use("/api/v1/listings") — line 88
- app.use("/api/v1/listings") — line 89
- app.use("/api/v1/search") — line 90
- app.use("/api/v1/listing-images") — line 91
- app.use("/api/v1/dealers") — line 92
- app.use("/api/v1/dealer/uploads") — line 93
- app.use("/api/v1/admin") — line 94
- app.use("/api/v1/notifications") — line 95

---

**[apps/backend/src/config/database.ts](../apps/backend/src/config/database.ts)**

Configuration, validated environment settings, or a shared external-service client.

Exported declarations: `connectDatabase`, `disconnectDatabase`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `connectDatabase` (line 5) | None | Opens the shared Mongoose connection before the API starts accepting requests. Direct named calls: `mongoose.connect`. |
| `disconnectDatabase` (line 10) | None | Closes MongoDB cleanly during application shutdown. Direct named calls: `mongoose.disconnect`. |

---

**[apps/backend/src/config/env.ts](../apps/backend/src/config/env.ts)**

Configuration, validated environment settings, or a shared external-service client.

Exported declarations: `env`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/config/firebase.ts](../apps/backend/src/config/firebase.ts)**

Configuration, validated environment settings, or a shared external-service client.

Exported declarations: `firebaseAuth`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/config/logger.ts](../apps/backend/src/config/logger.ts)**

Configuration, validated environment settings, or a shared external-service client.

Exported declarations: `logger`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/config/mongoUri.test.ts](../apps/backend/src/config/mongoUri.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: findProductionMongoUriProblems (line 4)
- it: accepts an Atlas SRV URI naming the production database (line 5)
- it: accepts a standard URI with TLS enabled (line 9)
- it: rejects unencrypted and local connections (line 13)
- it: rejects SRV URIs that explicitly disable TLS (line 19)
- it.each(['motorx_test', 'motorx-dev', 'motorx_development', 'local']): rejects the non-production database %s (line 23)
- it: requires an explicit database name (line 27)
- it: rejects strings that are not MongoDB URIs (line 31)

---

**[apps/backend/src/config/queue.ts](../apps/backend/src/config/queue.ts)**

Configuration, validated environment settings, or a shared external-service client.

Exported declarations: `inventoryQueue`, `closeInventoryQueue`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `closeInventoryQueue` (line 20) | None | Closes the Redis producer during graceful backend shutdown. Direct named calls: `inventoryQueue.close`. |

---

**[apps/backend/src/config/redis.ts](../apps/backend/src/config/redis.ts)**

Configuration, validated environment settings, or a shared external-service client.

Exported declarations: `redisClient`, `disconnectRedis`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `disconnectRedis` (line 17) | None | No leading explanation comment; read the linked implementation. Direct named calls: `redisClient.quit`. |

---

**[apps/backend/src/config/storage.ts](../apps/backend/src/config/storage.ts)**

Configuration, validated environment settings, or a shared external-service client.

Exported declarations: `storageClient`, `storageConfig`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/admin/admin.controller.ts](../apps/backend/src/modules/admin/admin.controller.ts)**

HTTP boundary: reads request values, calls services, and sends responses.

Exported declarations: `getAdminUsers`, `patchAdminUser`, `getAdminListings`, `removeAdminListing`, `getAdminDashboardStats`, `getAdminAuditLogs`, `getAdminUploads`, `getAdminSystemHealth`, `getAdminDealerApplications`, `getAdminDealerDocument`, `approveAdminDealerApplication`, `rejectAdminDealerApplication`, `getAdminUserDetails`, `getAdminUploadRecords`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `getAdminUsers` (line 9) | request, response | Sends the filtered user-management collection. Direct named calls: `getUsersForAdmin`, `sendSuccess`. |
| `patchAdminUser` (line 12) | request, response | Applies an administrator-requested account status change. Direct named calls: `sendSuccess`, `changeUserStatusAsAdmin`, `String`. |
| `getAdminListings` (line 15) | request, response | Sends the filtered cross-dealership listing collection. Direct named calls: `getListingsForAdmin`, `sendSuccess`. |
| `removeAdminListing` (line 18) | request, response | Archives one listing through the admin service. Direct named calls: `sendSuccess`, `removeListingAsAdmin`, `String`. |
| `getAdminDashboardStats` (line 21) | _request, response | Sends aggregate platform statistics. Direct named calls: `sendSuccess`, `getDashboardStatsForAdmin`. |
| `getAdminAuditLogs` (line 24) | request, response | Sends filtered persistent administrative events. Direct named calls: `getAuditLogsForAdmin`, `sendSuccess`. |
| `getAdminUploads` (line 27) | request, response | Sends platform-wide upload processing activity. Direct named calls: `getUploadsForAdmin`, `sendSuccess`. |
| `getAdminSystemHealth` (line 30) | _request, response | Sends the current operational status snapshot. Direct named calls: `sendSuccess`, `getSystemHealthForAdmin`. |
| `getAdminDealerApplications` (line 33) | request, response | Sends the pending dealer review queue. Direct named calls: `sendSuccess`, `getDealerApplicationsForAdmin`. |
| `getAdminDealerDocument` (line 36) | request, response | Streams one protected dealer verification document. Direct named calls: `getDealerDocumentForAdmin`, `String`, `Number`, `readDealerDocument`, `response.setHeader`, `document.originalName.replace`, `response.send`. |
| `approveAdminDealerApplication` (line 50) | request, response | Approves one pending dealer application. Direct named calls: `sendSuccess`, `reviewDealerApplicationAsAdmin`, `String`. |
| `rejectAdminDealerApplication` (line 53) | request, response | Rejects one pending dealer application with a reason. Direct named calls: `sendSuccess`, `reviewDealerApplicationAsAdmin`, `String`. |
| `getAdminUserDetails` (line 55) | request, response | No leading explanation comment; read the linked implementation. Direct named calls: `response.setHeader`, `sendSuccess`, `getUserDetailsForAdmin`, `String`. |
| `getAdminUploadRecords` (line 59) | request, response | No leading explanation comment; read the linked implementation. Direct named calls: `getUploadRecordsForAdmin`, `String`, `sendSuccess`. |

---

**[apps/backend/src/modules/admin/admin.documentAccess.test.ts](../apps/backend/src/modules/admin/admin.documentAccess.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: admin access to dealer verification documents (line 36)
- it: records who viewed which document in the audit log (line 39)
- it: answers 410 Gone once documents were deleted by the retention policy, without logging a view (line 50)
- it: does not log a view for a document index that does not exist (line 57)

---

**[apps/backend/src/modules/admin/admin.model.ts](../apps/backend/src/modules/admin/admin.model.ts)**

Database shapes, Mongoose models, and indexes. Models describe stored documents; they do not open the database connection.

Exported declarations: `AdminAuditEvent`, `AdminAuditLog`, `AdminAuditLogModel`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/admin/admin.repository.test.ts](../apps/backend/src/modules/admin/admin.repository.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: admin repository (line 7)
- it: lists pending dealer applications oldest first (line 10)

---

**[apps/backend/src/modules/admin/admin.repository.ts](../apps/backend/src/modules/admin/admin.repository.ts)**

Persistence operations: reads or writes stored records for the owning feature.

Exported declarations: `listAdminUsers`, `updateAdminUserStatus`, `listAdminListings`, `archiveListingByAdmin`, `getAdminStats`, `createAdminAuditLog`, `listAdminAuditLogs`, `listAdminUploads`, `listDealerApplications`, `listPendingDealerApplications`, `findDealerApplicationById`, `updateDealerApplicationReview`, `promoteApplicantToDealer`, `findAdminUser`, `findAdminDealer`, `findAdminUpload`, `listAdminUploadRecords`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `escapeRegex` (line 11) | value | No leading explanation comment; read the linked implementation. Direct named calls: `value.replace`. |
| `listAdminUsers` (line 14) | options | Builds a bounded user query without exposing raw search input to regex syntax. Direct named calls: `escapeRegex`, `Promise.all`, `AuthUserModel.find`, `AuthUserModel.countDocuments`. |
| `updateAdminUserStatus` (line 29) | userId, status, session | No leading explanation comment; read the linked implementation. Direct named calls: `AuthUserModel.findByIdAndUpdate`. |
| `listAdminListings` (line 34) | options | Includes dealer identity so administrators can moderate across dealerships. Direct named calls: `escapeRegex`, `Promise.all`, `ListingModel.find`, `ListingModel.countDocuments`. |
| `archiveListingByAdmin` (line 51) | listingId, session | Soft removal preserves the listing for later audit inspection. Direct named calls: `ListingModel.findByIdAndUpdate`. |
| `getAdminStats` (line 57) | None | Independent counts run together to minimize dashboard latency. Direct named calls: `Promise.all`, `AuthUserModel.countDocuments`, `ListingModel.countDocuments`, `DealerModel.countDocuments`. |
| `createAdminAuditLog` (line 68) | input, session | No leading explanation comment; read the linked implementation. Direct named calls: `AdminAuditLogModel.create`. |
| `createdWithin` (line 73) | from, to | createdAt condition for an inclusive YYYY-MM-DD date range (UTC days). |
| `listAdminAuditLogs` (line 78) | options | No leading explanation comment; read the linked implementation. Direct named calls: `createdWithin`, `Promise.all`, `AdminAuditLogModel.find`, `AdminAuditLogModel.countDocuments`. |
| `listAdminUploads` (line 87) | options | No leading explanation comment; read the linked implementation. Direct named calls: `createdWithin`, `Promise.all`, `UploadJobModel.find`, `UploadJobModel.countDocuments`. |
| `listDealerApplications` (line 99) | options | Loads pending applications in submission order for the admin review queue. Direct named calls: `DealerModel.find`. |
| `listPendingDealerApplications` (line 105) | None | Backward-compatible pending queue helper for repository callers and tests. Direct named calls: `listDealerApplications`. |
| `findDealerApplicationById` (line 110) | dealerId, session | Loads one application, optionally inside the review transaction. Direct named calls: `DealerModel.findById`. |
| `updateDealerApplicationReview` (line 115) | dealerId, status, adminId, rejectionReason, session | Applies a review decision only while the application remains pending. Direct named calls: `DealerModel.findOneAndUpdate`. |
| `promoteApplicantToDealer` (line 123) | userId, session | Grants dealer access in the same transaction as application approval. Direct named calls: `AuthUserModel.findByIdAndUpdate`. |
| `findAdminUser` (line 127) | userId | No leading explanation comment; read the linked implementation. Direct named calls: `AuthUserModel.findById`. |
| `findAdminDealer` (line 128) | userId | No leading explanation comment; read the linked implementation. Direct named calls: `DealerModel.findOne`. |
| `findAdminUpload` (line 131) | uploadId | No leading explanation comment; read the linked implementation. Direct named calls: `UploadJobModel.findById`. |
| `listAdminUploadRecords` (line 132) | uploadId, options | No leading explanation comment; read the linked implementation. Direct named calls: `Promise.all`, `model.find`, `model.countDocuments`. |

---

**[apps/backend/src/modules/admin/admin.routes.ts](../apps/backend/src/modules/admin/admin.routes.ts)**

Route definitions: inspect the listed registrations and guards. Express routes are mounted by backend app.ts; frontend route arrays are metadata, while app/App.tsx mounts the actual React routes.

Exported declarations: `adminRouter`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

HTTP registrations (relative to the mount in `app.ts`):

- adminRouter.get("/users") — line 15
- adminRouter.patch("/users/:userId") — line 16
- adminRouter.get("/listings") — line 17
- adminRouter.delete("/listings/:listingId") — line 18
- adminRouter.get("/stats") — line 19
- adminRouter.get("/audit-logs") — line 20
- adminRouter.get("/uploads") — line 21
- adminRouter.get("/system-health") — line 22
- adminRouter.get("/dealer-applications") — line 23
- adminRouter.get("/dealer-applications/:dealerId/documents/:documentIndex") — line 24
- adminRouter.patch("/dealer-applications/:dealerId/approve") — line 25
- adminRouter.patch("/dealer-applications/:dealerId/reject") — line 26
- adminRouter.get("/users/:userId") — line 28
- adminRouter.get("/uploads/:uploadId/records") — line 29

---

**[apps/backend/src/modules/admin/admin.service.ts](../apps/backend/src/modules/admin/admin.service.ts)**

Business operations and orchestration; see each function and its direct calls below.

Exported declarations: `getUsersForAdmin`, `changeUserStatusAsAdmin`, `getListingsForAdmin`, `removeListingAsAdmin`, `getDashboardStatsForAdmin`, `getAuditLogsForAdmin`, `getUploadsForAdmin`, `getSystemHealthForAdmin`, `getDealerApplicationsForAdmin`, `getDealerDocumentForAdmin`, `reviewDealerApplicationAsAdmin`, `getUserDetailsForAdmin`, `getUploadRecordsForAdmin`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `serializeUser` (line 17) | user | Converts user persistence fields into the admin API representation. Direct named calls: `String`. |
| `serializeListing` (line 20) | record | Converts populated listing fields into the admin API representation. Direct named calls: `String`. |
| `serializeDealer` (line 26) | dealer | Converts dealer persistence fields into the shared administration contract. Direct named calls: `dealer._id.toString`, `dealer.userId.toString`, `dealer.reviewedBy?.toString`, `dealer.reviewedAt?.toISOString`, `dealer.documentsDeletedAt?.toISOString`, `serializeReviewState`, `dealer.createdAt.toISOString`, `dealer.updatedAt.toISOString`. |
| `inTransaction` (line 42) | fn | Runs fn in one MongoDB transaction (retried by the driver on transient errors) and returns its result. Direct named calls: `mongoose.startSession`, `session.withTransaction`, `session.endSession`. |
| `getUsersForAdmin` (line 52) | query | Returns a paginated administrative view of user accounts. Direct named calls: `listAdminUsers`, `result.documents.map`, `buildPaginationMeta`. |
| `changeUserStatusAsAdmin` (line 55) | userId, status, adminId | Changes account access and records the significant operation. Direct named calls: `adminId.toString`, `inTransaction`, `invalidateHiddenDealerIds`, `notifyAccountSuspended`, `serializeUser`. |
| `getListingsForAdmin` (line 72) | query | Returns a paginated cross-dealership listing view. Direct named calls: `listAdminListings`, `result.documents.map`, `buildPaginationMeta`. |
| `removeListingAsAdmin` (line 75) | listingId, adminId | Archives a listing and records which administrator removed it. Direct named calls: `inTransaction`, `notifyListingRemoved`, `record._id.toString`, `record.createdAt.toISOString`, `serializeListing`. |
| `getDashboardStatsForAdmin` (line 98) | None | Returns database-backed dashboard totals. Direct named calls: `getAdminStats`. |
| `getAuditLogsForAdmin` (line 101) | query | Returns paginated audit history with populated administrator names. Direct named calls: `listAdminAuditLogs`, `result.documents.map`, `buildPaginationMeta`. |
| `getUploadsForAdmin` (line 108) | query | Returns paginated platform-wide inventory upload activity. Direct named calls: `listAdminUploads`, `result.documents.map`, `buildPaginationMeta`. |
| `getSystemHealthForAdmin` (line 121) | None | Reports truthful live state for configured backend dependencies. Direct named calls: `inventoryQueue.getJobCounts`, `Date.now`, `Math.floor`, `process.uptime`, `lastSeenAt?.toISOString`. |
| `getDealerApplicationsForAdmin` (line 147) | query | Returns the pending applications visible to administrators. Direct named calls: `listDealerApplications`, `records.map`. |
| `getDealerDocumentForAdmin` (line 151) | dealerId, index, adminId | Returns protected document metadata after validating its application and index, and records who opened which identity document in the audit log before any bytes are released. Direct named calls: `findDealerApplicationById`, `dealer.documentsDeletedAt.toISOString`, `createAdminAuditLog`. |
| `assertApplicantEmailVerified` (line 163) | dealerId | A dealer can publish to every buyer, so their email must be proven before approval. Checked with Firebase at approval time (not from a token), so it reflects the applicant's current state. Direct named calls: `findDealerApplicationById`, `AuthUserModel.findById`, `firebaseAuth.getUser`. |
| `reviewDealerApplicationAsAdmin` (line 173) | dealerId, adminId, decision, reason | Reviews an application, role assignment, and audit record as one transaction. Direct named calls: `assertApplicantEmailVerified`, `mongoose.startSession`, `session.withTransaction`, `session.endSession`, `notifyDealerApplicationDecision`. |
| `getUserDetailsForAdmin` (line 194) | userId | No leading explanation comment; read the linked implementation. Direct named calls: `findAdminUser`, `findAdminDealer`, `serializeUser`. |
| `getUploadRecordsForAdmin` (line 200) | uploadId, query | No leading explanation comment; read the linked implementation. Direct named calls: `findAdminUpload`, `listAdminUploadRecords`, `result.documents.map`, `buildPaginationMeta`. |

---

**[apps/backend/src/modules/admin/admin.validation.test.ts](../apps/backend/src/modules/admin/admin.validation.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: admin validation (line 4)
- it: applies bounded pagination defaults to admin collections (line 5)
- it: accepts supported user filters (line 10)
- it: accepts supported listing filters (line 16)
- it: rejects unsupported status values (line 22)

---

**[apps/backend/src/modules/admin/admin.validation.ts](../apps/backend/src/modules/admin/admin.validation.ts)**

Validation rules and related types; these reject or normalize unsupported input.

Exported declarations: `listAdminUsersQuerySchema`, `adminUserIdParamsSchema`, `updateAdminUserBodySchema`, `listAdminListingsQuerySchema`, `adminListingIdParamsSchema`, `adminDealerIdParamsSchema`, `adminDealerDocumentParamsSchema`, `rejectDealerApplicationBodySchema`, `listAdminAuditQuerySchema`, `listAdminUploadsQuerySchema`, `listAdminDealerApplicationsQuerySchema`, `ListAdminUsersQuery`, `ListAdminListingsQuery`, `ListAdminAuditQuery`, `ListAdminUploadsQuery`, `ListAdminDealerApplicationsQuery`, `adminUploadIdParamsSchema`, `adminUploadRecordsQuerySchema`, `AdminUploadRecordsQuery`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/admin/audit-log.model.ts](../apps/backend/src/modules/admin/audit-log.model.ts)**

Database shapes, Mongoose models, and indexes. Models describe stored documents; they do not open the database connection.

Exported declarations: `AuditLogDocument`, `AuditLogModel`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/admin/index.ts](../apps/backend/src/modules/admin/index.ts)**

Module entry point or re-export barrel; inspect exported symbols/import targets.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/auth-users/authUser.model.ts](../apps/backend/src/modules/auth-users/authUser.model.ts)**

Database shapes, Mongoose models, and indexes. Models describe stored documents; they do not open the database connection.

Exported declarations: `AuthUser`, `AuthUserDocument`, `AuthUserModel`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/auth-users/authUser.repository.ts](../apps/backend/src/modules/auth-users/authUser.repository.ts)**

Persistence operations: reads or writes stored records for the owning feature.

Exported declarations: `findOrCreateAuthUser`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `findOrCreateAuthUser` (line 11) | identity | Synchronizes a verified Firebase identity with its local MotorX user. Reads on every request (role and suspension status must always be current) but writes only when the account is new, its email or name changed, or lastLoginAt is older than LAST_LOGIN_REFRESH_MS. Direct named calls: `identity.email?.trim`, `AuthUserModel.findOne`, `Date.now`, `AuthUserModel.findOneAndUpdate`. |

---

**[apps/backend/src/modules/auth-users/authUser.routes.ts](../apps/backend/src/modules/auth-users/authUser.routes.ts)**

Route definitions: inspect the listed registrations and guards. Express routes are mounted by backend app.ts; frontend route arrays are metadata, while app/App.tsx mounts the actual React routes.

Exported declarations: `authUserRouter`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `serializeUser` (line 18) | user | No leading explanation comment; read the linked implementation. |

HTTP registrations (relative to the mount in `app.ts`):

- authUserRouter.get("/me") — line 31
- authUserRouter.patch("/me") — line 42

---

**[apps/backend/src/modules/auth-users/index.ts](../apps/backend/src/modules/auth-users/index.ts)**

Module entry point or re-export barrel; inspect exported symbols/import targets.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/buyers/buyer.controller.ts](../apps/backend/src/modules/buyers/buyer.controller.ts)**

HTTP boundary: reads request values, calls services, and sends responses.

Exported declarations: `getBuyerListings`, `getBuyerListing`, `getSimilarListings`, `getRecommendedListings`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `getBuyerListings` (line 7) | request, response | Sends the public marketplace collection without using response metadata. Direct named calls: `sendSuccess`, `browseListingsAsBuyer`. |
| `getBuyerListing` (line 10) | request, response | Sends one public vehicle listing. Direct named calls: `sendSuccess`, `viewListingAsBuyer`, `String`. |
| `getSimilarListings` (line 13) | request, response | Sends the public listings most like one listing. Direct named calls: `sendSuccess`, `similarListingsForBuyer`, `String`. |
| `getRecommendedListings` (line 18) | request, response | Sends public listings matched to the vehicles this browser viewed recently. Direct named calls: `sendSuccess`, `recommendedListingsForBuyer`. |

---

**[apps/backend/src/modules/buyers/buyer.repository.ts](../apps/backend/src/modules/buyers/buyer.repository.ts)**

Persistence operations: reads or writes stored records for the owning feature.

Exported declarations: `listBuyerListings`, `findBuyerListingById`, `findRecommendationCandidates`, `findViewedListings`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `listBuyerListings` (line 8) | options | Returns a filtered page containing only publicly available listings. Direct named calls: `listStructuredListings`. |
| `findBuyerListingById` (line 11) | listingId | Returns one listing only when it is public: active, and its dealer is not suspended. Direct named calls: `ListingModel.findOne`, `publicDealerFilter`. |
| `findRecommendationCandidates` (line 15) | options | Most-recent public listings that could be recommended: bounded, index-friendly (status + category + price), never including the vehicles the buyer is already looking at. Direct named calls: `publicDealerFilter`, `ListingModel.find`. |
| `findViewedListings` (line 23) | ids | The vehicles a buyer recently viewed, used only to describe their taste. Sold listings still count (the buyer liked that kind of vehicle); drafts and archived listings never do. Direct named calls: `ListingModel.find`. |

---

**[apps/backend/src/modules/buyers/buyer.routes.ts](../apps/backend/src/modules/buyers/buyer.routes.ts)**

Route definitions: inspect the listed registrations and guards. Express routes are mounted by backend app.ts; frontend route arrays are metadata, while app/App.tsx mounts the actual React routes.

Exported declarations: `buyerRouter`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

HTTP registrations (relative to the mount in `app.ts`):

- buyerRouter.get("/") — line 8
- buyerRouter.get("/recommendations") — line 10
- buyerRouter.get("/:listingId/similar") — line 11
- buyerRouter.get("/:listingId") — line 12

---

**[apps/backend/src/modules/buyers/buyer.service.ts](../apps/backend/src/modules/buyers/buyer.service.ts)**

Business operations and orchestration; see each function and its direct calls below.

Exported declarations: `BuyerDealerInfo`, `BuyerListingDetailDto`, `browseListingsAsBuyer`, `viewListingAsBuyer`, `similarListingsForBuyer`, `recommendedListingsForBuyer`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `browseListingsAsBuyer` (line 16) | query | Returns listings and pagination together inside data instead of response metadata. Direct named calls: `listBuyerListings`, `result.documents.map`, `buildPaginationMeta`. |
| `viewListingAsBuyer` (line 19) | listingId | Returns the requested active listing, with its dealer's public profile, or a public not-found response. Direct named calls: `findBuyerListingById`, `DealerModel.findOne`, `serializeListing`. |
| `candidatePool` (line 39) | options, wanted | Candidates in a similar price band first. When that band is too thin (a rare model, a small marketplace), other vehicles of the same types fill the gap, so the section is rarely empty. Direct named calls: `findRecommendationCandidates`, `nearby.map`, `wider.filter`. |
| `similarListingsForBuyer` (line 48) | listingId, limit | "Similar vehicles" on a listing page: the same kind of vehicle, closest in make, model, price and age. Direct named calls: `findBuyerListingById`, `candidatePool`, `rankByScore`. |
| `recommendedListingsForBuyer` (line 57) | viewedIds, limit | "Recommended for you": ranks public listings against the vehicles this browser viewed recently (sent by the page, newest first). Nothing about the buyer is stored on the server. Direct named calls: `findViewedListings`, `viewedIds.map`, `seeds.map`, `candidatePool`, `Math.min`, `Math.max`, `rankByScore`. |

---

**[apps/backend/src/modules/buyers/buyer.similarity.test.ts](../apps/backend/src/modules/buyers/buyer.similarity.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `vary` (line 5) | changes | No leading explanation comment; read the linked implementation. |

Declared test groups and cases:

- describe: vehicle similarity (line 7)
- it: scores the same model above the same make above another make (line 8)
- it: prefers a closer price and year (line 16)
- it: ignores letter case and spacing in makes, and compares the town part of a location (line 21)
- it: weights the most recently viewed vehicle more than older views (line 25)
- it: keeps the original (newest first) order for equal scores (line 32)

---

**[apps/backend/src/modules/buyers/buyer.similarity.ts](../apps/backend/src/modules/buyers/buyer.similarity.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `ComparableVehicle`, `similarityScore`, `profileScore`, `rankByScore`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `same` (line 14) | a, b | No leading explanation comment; read the linked implementation. Direct named calls: `a.trim`, `b.trim`. |
| `closeness` (line 15) | difference, range | No leading explanation comment; read the linked implementation. Direct named calls: `Math.max`, `Math.abs`. |
| `town` (line 16) | location | No leading explanation comment; read the linked implementation. Direct named calls: `location.split`. |
| `similarityScore` (line 18) | seed, candidate | No leading explanation comment; read the linked implementation. Direct named calls: `same`, `closeness`, `Math.max`, `town`. |
| `profileScore` (line 41) | seeds, candidate | Recently viewed vehicles count more than older ones: the latest has weight 1, then 0.85, 0.72... Direct named calls: `seeds.forEach`. |
| `rankByScore` (line 48) | candidates, score, limit | Highest score first; equal scores keep the newer listing first (candidates arrive newest first). Direct named calls: `candidates.map`. |

---

**[apps/backend/src/modules/buyers/buyer.validation.ts](../apps/backend/src/modules/buyers/buyer.validation.ts)**

Validation rules and related types; these reject or normalize unsupported input.

Exported declarations: `similarListingsQuerySchema`, `recommendationsQuerySchema`, `SimilarListingsQuery`, `RecommendationsQuery`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/buyers/index.ts](../apps/backend/src/modules/buyers/index.ts)**

Module entry point or re-export barrel; inspect exported symbols/import targets.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/dealers/dealer.controller.ts](../apps/backend/src/modules/dealers/dealer.controller.ts)**

HTTP boundary: reads request values, calls services, and sends responses.

Exported declarations: `createApplication`, `getMyApplication`, `updateMyProfile`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `createApplication` (line 9) | request, response | Handles submission of a buyer's dealer application. Direct named calls: `storeDealerDocuments`, `request.localUser!._id.toString`, `submitDealerApplication`, `sendSuccess`, `deleteDealerDocuments`. |
| `getMyApplication` (line 24) | request, response | Returns the authenticated user's application. Direct named calls: `sendSuccess`, `getMyDealerApplication`. |
| `updateMyProfile` (line 29) | request, response | Updates the approved dealer's editable business details. Direct named calls: `sendSuccess`, `updateMyDealerProfile`. |

---

**[apps/backend/src/modules/dealers/dealer.model.ts](../apps/backend/src/modules/dealers/dealer.model.ts)**

Database shapes, Mongoose models, and indexes. Models describe stored documents; they do not open the database connection.

Exported declarations: `Dealer`, `DealerDocument`, `DealerModel`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/dealers/dealer.repository.test.ts](../apps/backend/src/modules/dealers/dealer.repository.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `application` (line 11) | businessName, registrationNumber, phone, address | No leading explanation comment; read the linked implementation. Direct named calls: `registrationNumber.toLowerCase`. |

Declared test groups and cases:

- describe: dealer repository (line 6)
- it: creates a pending dealer application and finds it by user id (line 20)

---

**[apps/backend/src/modules/dealers/dealer.repository.ts](../apps/backend/src/modules/dealers/dealer.repository.ts)**

Persistence operations: reads or writes stored records for the owning feature.

Exported declarations: `findDealerByUserId`, `createDealer`, `resubmitRejectedApplication`, `updateApprovedDealerProfile`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `findDealerByUserId` (line 8) | userId | Finds the single dealer application belonging to a user. Direct named calls: `DealerModel.findOne`. |
| `createDealer` (line 10) | userId, input | Creates a pending dealer application for a buyer. Direct named calls: `DealerModel.create`. |
| `resubmitRejectedApplication` (line 15) | previous, input | Replaces a rejected application with the corrected one and sends it back for review. The earlier decision moves to reviewHistory. Matching on status 'rejected' turns a concurrent double submission (or one after approval) into a no-op that returns null. Direct named calls: `DealerModel.findOneAndUpdate`. |
| `updateApprovedDealerProfile` (line 33) | userId, input | Updates an approved dealer's editable business details (website '' removes the website). Direct named calls: `DealerModel.findOneAndUpdate`. |

---

**[apps/backend/src/modules/dealers/dealer.routes.ts](../apps/backend/src/modules/dealers/dealer.routes.ts)**

Route definitions: inspect the listed registrations and guards. Express routes are mounted by backend app.ts; frontend route arrays are metadata, while app/App.tsx mounts the actual React routes.

Exported declarations: `dealerRouter`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

HTTP registrations (relative to the mount in `app.ts`):

- dealerRouter.post("/applications") — line 17
- dealerRouter.get("/me") — line 18
- dealerRouter.patch("/me/profile") — line 19

---

**[apps/backend/src/modules/dealers/dealer.service.ts](../apps/backend/src/modules/dealers/dealer.service.ts)**

Business operations and orchestration; see each function and its direct calls below.

Exported declarations: `serializeReviewState`, `submitDealerApplication`, `getMyDealerApplication`, `updateMyDealerProfile`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `serializeReviewState` (line 12) | dealer | Submission time and earlier rejections, shared by the dealer and admin representations. |
| `serializeDealer` (line 20) | dealer | Converts a MongoDB dealer record into the public API contract. Direct named calls: `dealer._id.toString`, `dealer.userId.toString`, `dealer.reviewedBy?.toString`, `dealer.reviewedAt?.toISOString`, `dealer.documentsDeletedAt?.toISOString`, `serializeReviewState`, `dealer.createdAt.toISOString`, `dealer.updatedAt.toISOString`. |
| `submitDealerApplication` (line 40) | userId, role, input, verificationDocuments | Creates a buyer's dealer application or, after a rejection, replaces it with the corrected version: the earlier decision is kept in reviewHistory and its documents are deleted. Direct named calls: `findDealerByUserId`, `resubmitRejectedApplication`, `deleteDealerDocuments`, `serializeDealer`, `resubmitted.toObject`, `notifyDealerApplicationSubmitted`, `createDealer`. |
| `getMyDealerApplication` (line 66) | userId | Returns the current user's dealer application and review state. Direct named calls: `findDealerByUserId`, `serializeDealer`. |
| `updateMyDealerProfile` (line 74) | userId, input | Lets an approved dealer keep their public business details current (FR-DEALER-03). Direct named calls: `updateApprovedDealerProfile`, `serializeDealer`. |

---

**[apps/backend/src/modules/dealers/dealer.validation.test.ts](../apps/backend/src/modules/dealers/dealer.validation.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: dealer application validation (line 21)
- it: normalizes multipart form fields into the dealer application shape (line 22)
- it: requires enough information for a meaningful review (line 32)
- it: requires a rejection reason (line 37)

---

**[apps/backend/src/modules/dealers/dealer.validation.ts](../apps/backend/src/modules/dealers/dealer.validation.ts)**

Validation rules and related types; these reject or normalize unsupported input.

Exported declarations: `createDealerApplicationSchema`, `updateDealerProfileSchema`, `dealerIdParamsSchema`, `rejectionBodySchema`, `CreateDealerApplicationBody`, `UpdateDealerProfileBody`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/dealers/dealerDocument.content.test.ts](../apps/backend/src/modules/dealers/dealerDocument.content.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `pdf` (line 6) | body | No leading explanation comment; read the linked implementation. Direct named calls: `Buffer.from`. |
| `file` (line 7) | buffer, originalname | No leading explanation comment; read the linked implementation. |

Declared test groups and cases:

- describe: detectDocumentType (line 9)
- it: identifies files by their bytes, not their name or declared type (line 10)
- describe: sanitizeDealerDocument (line 18)
- it: accepts a plain PDF unchanged (line 19)
- it.each([ ['JavaScript', '/OpenAction << /S /JavaScript /JS (app.alert(1)) >>'], ['a launch action', '/OpenAction << /S /Launch /F (cmd.exe) >>'], ['an embedded file', '/Names << /EmbeddedFiles 3 0 R >>'], ]): rejects a PDF containing %s (line 27)
- it: does not mistake /JSON-like names for scripts (line 35)
- it: rejects an executable renamed to .pdf (line 39)
- it: re-encodes image documents and strips their metadata (line 45)
- it: rejects a file that only starts like a JPEG (line 59)

---

**[apps/backend/src/modules/dealers/dealerDocument.content.ts](../apps/backend/src/modules/dealers/dealerDocument.content.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `DealerDocumentContentType`, `detectDocumentType`, `sanitizeDealerDocument`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `detectDocumentType` (line 17) | buffer | Identifies a file by its actual bytes; the browser-declared MIME type is never trusted. Direct named calls: `buffer.subarray`, `Buffer.from`. |
| `sanitizeDealerDocument` (line 28) | file | Validates one verification document and returns the bytes that may be stored. Images are rebuilt from their pixels (no metadata such as GPS location, no hidden data); PDFs are accepted only when they contain no scripts, launch actions, or embedded files. This is a content check, not an antivirus scan. Direct named calls: `detectDocumentType`, `PDF_ACTIVE_CONTENT.test`, `file.buffer.toString`, `reencodeImage`. |

---

**[apps/backend/src/modules/dealers/dealerDocument.middleware.ts](../apps/backend/src/modules/dealers/dealerDocument.middleware.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `uploadDealerDocuments`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `fileFilter` (line 10) | _request, file, callback | No leading explanation comment; read the linked implementation. Direct named calls: `callback`, `acceptedTypes.has`. |
| `uploadDealerDocuments` (line 17) | request, response, next | No leading explanation comment; read the linked implementation. Direct named calls: `documentUpload`. |

---

**[apps/backend/src/modules/dealers/dealerDocument.storage.ts](../apps/backend/src/modules/dealers/dealerDocument.storage.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `StoredDealerDocument`, `storeDealerDocuments`, `deleteDealerDocuments`, `readDealerDocument`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `storeDealerDocuments` (line 20) | userId, files | No leading explanation comment; read the linked implementation. Direct named calls: `Promise.all`, `files.map`, `randomUUID`, `storageClient.send`, `stored.push`, `deleteDealerDocuments`. |
| `deleteDealerDocuments` (line 42) | documents | No leading explanation comment; read the linked implementation. Direct named calls: `Promise.allSettled`, `documents.map`. |
| `readDealerDocument` (line 49) | key | No leading explanation comment; read the linked implementation. Direct named calls: `storageClient.send`, `Buffer.from`, `object.Body.transformToByteArray`. |

---

**[apps/backend/src/modules/dealers/index.ts](../apps/backend/src/modules/dealers/index.ts)**

Module entry point or re-export barrel; inspect exported symbols/import targets.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/inventory/index.ts](../apps/backend/src/modules/inventory/index.ts)**

Module entry point or re-export barrel; inspect exported symbols/import targets.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/inventory/inventory.controller.ts](../apps/backend/src/modules/inventory/inventory.controller.ts)**

HTTP boundary: reads request values, calls services, and sends responses.

Exported declarations: `uploadDealerInventory`, `uploadDealerInventoryImages`, `retryInventoryUpload`, `retryInventoryUploadImages`, `downloadInventoryCsvTemplate`, `listMyInventoryUploads`, `getMyInventoryUpload`, `listMyUploadRejectedRecords`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `uploadDealerInventory` (line 9) | request, response | Accepts one CSV (for the dealer-selected category) and immediately returns its queued upload job. Direct named calls: `sendSuccess`, `createInventoryUpload`. |
| `uploadDealerInventoryImages` (line 15) | request, response | Accepts one vehicle-photos zip for an already-processed upload job. Direct named calls: `sendSuccess`, `attachInventoryImagesZip`, `String`. |
| `retryInventoryUpload` (line 20) | request, response | Re-queues this dealer's failed CSV import (resumes from its last checkpoint). Direct named calls: `sendSuccess`, `retryDealerUpload`, `String`. |
| `retryInventoryUploadImages` (line 25) | request, response | Re-queues this dealer's failed photo processing for the zip already stored with the upload. Direct named calls: `sendSuccess`, `retryDealerUploadImages`, `String`. |
| `downloadInventoryCsvTemplate` (line 30) | request, response | Streams a downloadable CSV template (headers + example rows) for the requested category. Direct named calls: `getInventoryCsvTemplate`, `response.status`. |
| `listMyInventoryUploads` (line 36) | request, response | Sends the authenticated dealer's upload history without response metadata. Direct named calls: `sendSuccess`, `getDealerUploads`. |
| `getMyInventoryUpload` (line 39) | request, response | Sends one authenticated dealer-owned upload job. Direct named calls: `sendSuccess`, `getDealerUpload`, `String`. |
| `listMyUploadRejectedRecords` (line 42) | request, response | Sends the rejected rows for one authenticated dealer-owned upload job. Direct named calls: `sendSuccess`, `getDealerUploadRejectedRecords`, `String`. |

---

**[apps/backend/src/modules/inventory/inventory.middleware.ts](../apps/backend/src/modules/inventory/inventory.middleware.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `uploadSingleInventoryCsv`, `uploadSingleImagesZip`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `fileFilter` (line 7) | _request, file, callback | No leading explanation comment; read the linked implementation. Direct named calls: `callback`, `storageConfig.allowedInventoryTypes.has`. |
| `uploadSingleInventoryCsv` (line 10) | request, response, next | Parses one CSV and converts Multer errors into stable validation responses. Direct named calls: `csvUpload`. |
| `fileFilter` (line 21) | _request, file, callback | No leading explanation comment; read the linked implementation. Direct named calls: `callback`, `zipMimeTypes.has`. |
| `uploadSingleImagesZip` (line 24) | request, response, next | Parses one vehicle-photos zip and converts Multer errors into stable validation responses. Direct named calls: `imagesZipUpload`. |

---

**[apps/backend/src/modules/inventory/inventory.queue.test.ts](../apps/backend/src/modules/inventory/inventory.queue.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `jobIn` (line 8) | state | No leading explanation comment; read the linked implementation. Direct named calls: `vi.fn`. |

Declared test groups and cases:

- describe: inventory queue publishing (line 10)
- it: queues a new upload under its fixed job ID (line 13)
- it: processes photos attached a second time: the finished run is removed, then queued again (line 19)
- it: does the same after a failed run (line 30)
- it: leaves a job that is still waiting or running alone, so it is never processed twice at once (line 38)

---

**[apps/backend/src/modules/inventory/inventory.queue.ts](../apps/backend/src/modules/inventory/inventory.queue.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `enqueueInventoryUpload`, `enqueueInventoryImages`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `addUnderFixedId` (line 11) | name, uploadJobId, bullJobId | Adds a job under its fixed ID. BullMQ keeps finished jobs for a while and silently ignores a new job with the same ID, so a dealer attaching photos to the same upload a second time (or retrying) would never be processed. A finished job is removed first; a job still waiting or running is left alone. The ID stays fixed because the worker's reaper finds jobs by it (same rule as there). Direct named calls: `inventoryQueue.getJob`, `ALIVE_STATES.has`, `existing.getState`, `existing.remove`, `inventoryQueue.add`. |
| `enqueueInventoryUpload` (line 21) | uploadJobId | Publishes only the durable MongoDB job ID, keeping CSV content out of Redis. Direct named calls: `addUnderFixedId`, `inventoryBullJobId.csv`. |
| `enqueueInventoryImages` (line 24) | uploadJobId | The photo stage of the same upload, under its own suffixed ID so it never collides with the CSV job. Direct named calls: `addUnderFixedId`, `inventoryBullJobId.images`. |

---

**[apps/backend/src/modules/inventory/inventory.repository.ts](../apps/backend/src/modules/inventory/inventory.repository.ts)**

Persistence operations: reads or writes stored records for the owning feature.

Exported declarations: `createUploadJob`, `listDealerUploadJobs`, `findDealerUploadJob`, `markImageProcessingPending`, `resetFailedUploadJob`, `resetFailedImageProcessing`, `listRejectedRecordsForUpload`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `createUploadJob` (line 7) | input | Creates the durable pending job before it is published to Redis. Direct named calls: `UploadJobModel.create`. |
| `listDealerUploadJobs` (line 10) | dealerId, page, limit | Lists only upload jobs owned by the authenticated dealer. Direct named calls: `Promise.all`, `UploadJobModel.find`, `UploadJobModel.countDocuments`. |
| `findDealerUploadJob` (line 13) | uploadId, dealerId | Finds one upload only when it belongs to the authenticated dealer. Direct named calls: `UploadJobModel.findOne`. |
| `markImageProcessingPending` (line 19) | uploadId, dealerId, input | Removes a pending record during compensation after enqueueing failure. Marks a finished CSV upload job as having a photos zip queued for processing. Only allowed once the CSV itself has finished, so the zip only ever matches listings that actually got created, and never while an earlier zip is still queued or running. A new zip gets a fresh attempt budget. Direct named calls: `UploadJobModel.findOneAndUpdate`. |
| `resetFailedUploadJob` (line 29) | uploadId, dealerId | Controlled retry of a failed CSV import: back to pending with a fresh attempt budget. Safe because processing resumes from its last checkpoint and never imports the same row twice. Direct named calls: `UploadJobModel.findOneAndUpdate`. |
| `resetFailedImageProcessing` (line 38) | uploadId, dealerId | Controlled retry of failed photo processing for the zip already stored with this upload. Direct named calls: `UploadJobModel.findOneAndUpdate`. |
| `listRejectedRecordsForUpload` (line 47) | uploadJobId, page, limit | Lists rejected rows for one upload job, most recent CSV row first. Direct named calls: `Promise.all`, `RejectedRecordModel.find`, `RejectedRecordModel.countDocuments`. |

---

**[apps/backend/src/modules/inventory/inventory.routes.ts](../apps/backend/src/modules/inventory/inventory.routes.ts)**

Route definitions: inspect the listed registrations and guards. Express routes are mounted by backend app.ts; frontend route arrays are metadata, while app/App.tsx mounts the actual React routes.

Exported declarations: `inventoryRouter`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

HTTP registrations (relative to the mount in `app.ts`):

- inventoryRouter.get("/template/:category") — line 15
- inventoryRouter.post("/") — line 18
- inventoryRouter.get("/") — line 19
- inventoryRouter.get("/:uploadId") — line 20
- inventoryRouter.get("/:uploadId/rejected-records") — line 21
- inventoryRouter.post("/:uploadId/images") — line 22
- inventoryRouter.post("/:uploadId/retry") — line 23
- inventoryRouter.post("/:uploadId/images/retry") — line 24

---

**[apps/backend/src/modules/inventory/inventory.service.test.ts](../apps/backend/src/modules/inventory/inventory.service.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `jobDocument` (line 25) | overrides | No leading explanation comment; read the linked implementation. |
| `jobDocument.toObject` (line 25) | None | No leading explanation comment; read the linked implementation. |

Declared test groups and cases:

- describe: inventory upload acceptance (line 27)
- it: queues the job straight away when Redis is available (line 35)
- it: keeps the accepted upload (file and job) when Redis is down, for the worker to queue later (line 45)
- it: does not make the dealer wait when Redis hangs instead of refusing (line 55)
- it: tells a dealer at the listing limit before storing anything (line 66)
- it: still removes the stored file if the MongoDB job itself cannot be created (line 73)
- describe: controlled retry of failed jobs (line 82)
- it: re-queues a failed CSV import owned by the dealer (line 85)
- it: refuses to retry an upload that is not failed (or belongs to another dealer) (line 93)
- it: re-queues failed photo processing under the images job (line 100)

---

**[apps/backend/src/modules/inventory/inventory.service.ts](../apps/backend/src/modules/inventory/inventory.service.ts)**

Business operations and orchestration; see each function and its direct calls below.

Exported declarations: `createInventoryUpload`, `getInventoryCsvTemplate`, `attachInventoryImagesZip`, `retryDealerUpload`, `retryDealerUploadImages`, `getDealerUploads`, `getDealerUpload`, `getDealerUploadRejectedRecords`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `serializeUpload` (line 16) | record | Converts an upload document into the dealer-safe API representation. Direct named calls: `String`. |
| `enqueueOrDefer` (line 30) | enqueue, uploadJobId | Enqueues promptly when Redis is reachable. A slow or failed enqueue never fails the request: the MongoDB job is already durable, and the worker re-queues any job left pending too long. Direct named calls: `Promise.race`, `enqueue`, `logger.warn`, `String`, `clearTimeout`. |
| `serializeRejectedRecord` (line 40) | record | Converts a rejected-record document into the dealer-safe API representation. Direct named calls: `String`. |
| `createInventoryUpload` (line 45) | dealerId, category, file | Stores, records, and enqueues one accepted CSV. Once the MongoDB job exists the upload is accepted: if Redis is unavailable the job simply stays pending and the worker's reconciler queues it later, instead of the upload being thrown away. Direct named calls: `validateInventoryCsv`, `assertDealerListingCapacity`, `file.originalname.replace`, `randomUUID`, `storeInventoryCsv`, `createUploadJob`, `Promise.allSettled`, `deleteInventoryCsv`, `enqueueOrDefer`, `job._id.toString`, `serializeUpload`, `job.toObject`. |
| `getInventoryCsvTemplate` (line 62) | category | Renders a downloadable CSV template (headers + example rows) for the given category. Direct named calls: `buildCsvTemplateContent`. |
| `attachInventoryImagesZip` (line 71) | dealerId, uploadId, file | Stores a vehicle-photos zip and queues it for matching against this upload job's listings. Only allowed once the CSV itself has finished (completed/completedWithErrors) — the zip is matched only against listings this exact job actually created. Direct named calls: `validateInventoryImagesZip`, `file.originalname.replace`, `randomUUID`, `storeInventoryImagesZip`, `markImageProcessingPending`, `Promise.allSettled`, `deleteInventoryImagesZip`, `enqueueOrDefer`, `serializeUpload`, `job.toObject`. |
| `retryDealerUpload` (line 87) | dealerId, uploadId | Controlled retry of a failed CSV import, owned by this dealer. Direct named calls: `resetFailedUploadJob`, `enqueueOrDefer`, `serializeUpload`, `job.toObject`. |
| `retryDealerUploadImages` (line 95) | dealerId, uploadId | Controlled retry of failed photo processing for this dealer's already uploaded zip. Direct named calls: `resetFailedImageProcessing`, `enqueueOrDefer`, `serializeUpload`, `job.toObject`. |
| `getDealerUploads` (line 103) | dealerId, query | Returns the authenticated dealer's upload history with pagination inside data. Direct named calls: `listDealerUploadJobs`, `result.documents.map`, `buildPaginationMeta`. |
| `getDealerUpload` (line 106) | dealerId, uploadId | Returns one dealer-owned upload or a non-disclosing not-found response. Direct named calls: `findDealerUploadJob`, `serializeUpload`. |
| `getDealerUploadRejectedRecords` (line 109) | dealerId, uploadId, query | Returns the rejected rows for one dealer-owned upload, verifying ownership first. Direct named calls: `findDealerUploadJob`, `listRejectedRecordsForUpload`, `result.documents.map`, `buildPaginationMeta`. |

---

**[apps/backend/src/modules/inventory/inventory.storage.ts](../apps/backend/src/modules/inventory/inventory.storage.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `storeInventoryCsv`, `deleteInventoryCsv`, `storeInventoryImagesZip`, `deleteInventoryImagesZip`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `storeInventoryCsv` (line 5) | key, file | Stores the original private inventory file for worker processing and traceability. Direct named calls: `storageClient.send`. |
| `deleteInventoryCsv` (line 8) | key | Removes an uploaded object when job creation or enqueueing cannot complete. Direct named calls: `storageClient.send`. |
| `storeInventoryImagesZip` (line 11) | key, file | Stores the original vehicle-photos zip for worker processing. Direct named calls: `storageClient.send`. |
| `deleteInventoryImagesZip` (line 14) | key | Removes an uploaded zip when job creation or enqueueing cannot complete. Direct named calls: `storageClient.send`. |

---

**[apps/backend/src/modules/inventory/inventory.validation.test.ts](../apps/backend/src/modules/inventory/inventory.validation.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: inventory upload validation (line 6)
- it: accepts a car CSV containing every required header (line 7)
- it: reports missing required headers for the selected category (line 11)
- it: requires different headers for a different category (motorcycle needs bikeType, not bodyType) (line 17)
- it: rejects non-CSV extensions and binary content (line 23)
- it: applies bounded history pagination (line 28)
- it: applies bounded rejected-records pagination (line 33)

---

**[apps/backend/src/modules/inventory/inventory.validation.ts](../apps/backend/src/modules/inventory/inventory.validation.ts)**

Validation rules and related types; these reject or normalize unsupported input.

Exported declarations: `inventoryUploadIdParamsSchema`, `listInventoryUploadsQuerySchema`, `ListInventoryUploadsQuery`, `listRejectedRecordsQuerySchema`, `ListRejectedRecordsQuery`, `uploadCategoryBodySchema`, `csvTemplateParamsSchema`, `validateInventoryCsv`, `validateInventoryImagesZip`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `validateInventoryCsv` (line 30) | file, category | Performs inexpensive structural checks before storing and enqueueing a CSV. Direct named calls: `file.originalname.toLowerCase`, `file.buffer.includes`, `file.buffer.subarray`, `Math.min`, `missing.join`. |
| `hasZipSignature` (line 41) | buffer | Zip's local-file-header signature ("PK\x03\x04") — also matches an empty archive's end-of-central-directory signature ("PK\x05\x06") so an intentionally empty zip isn't rejected. |
| `validateInventoryImagesZip` (line 47) | file | Performs inexpensive structural checks before storing and enqueueing a vehicle-photos zip. Direct named calls: `file.originalname.toLowerCase`, `hasZipSignature`. |

---

**[apps/backend/src/modules/inventory/rejectedRecord.model.ts](../apps/backend/src/modules/inventory/rejectedRecord.model.ts)**

Database shapes, Mongoose models, and indexes. Models describe stored documents; they do not open the database connection.

Exported declarations: `RejectedInventoryRecord`, `RejectedRecordModel`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/inventory/uploadJob.model.ts](../apps/backend/src/modules/inventory/uploadJob.model.ts)**

Database shapes, Mongoose models, and indexes. Models describe stored documents; they do not open the database connection.

Exported declarations: `ImageProcessingStatus`, `UploadJob`, `UploadJobModel`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/marketplace/index.ts](../apps/backend/src/modules/marketplace/index.ts)**

Module entry point or re-export barrel; inspect exported symbols/import targets.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/marketplace/listing.controller.ts](../apps/backend/src/modules/marketplace/listing.controller.ts)**

HTTP boundary: reads request values, calls services, and sends responses.

Exported declarations: `createListing`, `listMyListings`, `getMyListing`, `getMyListingStats`, `updateListing`, `updateListingStatus`, `bulkUpdateListings`, `deleteListing`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `createListing` (line 9) | request, response | Creates a listing owned by the authenticated dealer. Direct named calls: `createDealerListing`, `sendSuccess`. |
| `listMyListings` (line 15) | request, response | Sends all listings owned by the authenticated dealer. Direct named calls: `getDealerListings`, `sendSuccess`. |
| `getMyListing` (line 21) | request, response | Sends one listing owned by the authenticated dealer for preview or editing. Direct named calls: `sendSuccess`, `getDealerListing`, `String`. |
| `getMyListingStats` (line 25) | request, response | No leading explanation comment; read the linked implementation. Direct named calls: `sendSuccess`, `getDealerListingStats`. |
| `updateListing` (line 30) | request, response | Updates editable fields on an owned listing. Direct named calls: `sendSuccess`, `updateDealerListing`, `String`. |
| `updateListingStatus` (line 35) | request, response | Moves an owned listing through its allowed lifecycle. Direct named calls: `sendSuccess`, `changeDealerListingStatus`, `String`. |
| `bulkUpdateListings` (line 40) | request, response | Publishes, marks sold, archives, re-confirms, re-prices, or deletes many owned listings at once. Direct named calls: `sendSuccess`, `applyBulkListingAction`. |
| `deleteListing` (line 45) | request, response | Permanently deletes an owned listing. Direct named calls: `deleteDealerListing`, `String`, `sendSuccess`. |

---

**[apps/backend/src/modules/marketplace/listing.model.ts](../apps/backend/src/modules/marketplace/listing.model.ts)**

Database shapes, Mongoose models, and indexes. Models describe stored documents; they do not open the database connection.

Exported declarations: `ListingImage`, `Listing`, `ListingDocument`, `ListingModel`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/marketplace/listing.repository.test.ts](../apps/backend/src/modules/marketplace/listing.repository.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `carListing` (line 20) | overrides | No leading explanation comment; read the linked implementation. Direct named calls: `normalizeRegistrationNumber`. |

Declared test groups and cases:

- describe: listing repository — registration duplicate detection (line 8)
- it: finds an active listing sharing a normalized registration number (line 28)
- it: does not treat an archived listing as a blocking duplicate (line 34)
- it: excludes the listing being edited from its own duplicate check (line 40)
- it: does not match a different registration number (line 46)
- it: rejects a second draft/active listing for the same registration number at the DB level (line 52)
- it: allows relisting a registration number once the prior listing is archived (line 63)

---

**[apps/backend/src/modules/marketplace/listing.repository.ts](../apps/backend/src/modules/marketplace/listing.repository.ts)**

Persistence operations: reads or writes stored records for the owning feature.

Exported declarations: `ListingRecord`, `createListingRecord`, `findActiveListingByRegistration`, `staleListingFilter`, `listDealerListings`, `countOpenDealerListings`, `countDealerListings`, `updateOwnedListing`, `findOwnedListing`, `deleteOwnedListing`, `transitionOwnedListingStatus`, `addOwnedListingImage`, `removeOwnedListingImage`, `restoreOwnedListingImage`, `reorderOwnedListingImages`, `BulkListingScope`, `countListingsInScope`, `updateListingsInScope`, `deleteArchivedListingsInScope`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `createListingRecord` (line 7) | input | Inserts a dealer-owned listing document. Direct named calls: `ListingModel.create`. |
| `findActiveListingByRegistration` (line 13) | normalizedRegistrationNumber, excludeListingId | Finds a currently listed (draft/active) vehicle sharing the given normalized registration number, excluding one listing (used when editing/reactivating that same listing). Direct named calls: `ListingModel.findOne`. |
| `staleListingFilter` (line 23) | dealerId, cutoff | Active listings the dealer has not confirmed since `cutoff`. Listings saved before lastConfirmedAt existed fall back to their last update time. |
| `listDealerListings` (line 28) | dealerId, page, limit, options | Returns all statuses of listings owned by one dealer. Direct named calls: `staleListingFilter`, `options.search.replace`, `Promise.all`, `ListingModel.find`, `ListingModel.countDocuments`. |
| `countOpenDealerListings` (line 44) | dealerId | Listings that count toward the per-dealer limit: drafts and active listings (sold and archived do not). Direct named calls: `ListingModel.countDocuments`. |
| `countDealerListings` (line 48) | dealerId, staleBefore | No leading explanation comment; read the linked implementation. Direct named calls: `Promise.all`, `ListingModel.countDocuments`, `staleListingFilter`. |
| `updateOwnedListing` (line 58) | listingId, dealerId, update, unsetDescription, unsetEmbedding | Updates a listing only when it belongs to the authenticated dealer. Direct named calls: `ListingModel.findOneAndUpdate`, `Object.keys`. |
| `findOwnedListing` (line 68) | listingId, dealerId | Loads a listing scoped to its owner for business-rule checks. Direct named calls: `ListingModel.findOne`. |
| `deleteOwnedListing` (line 73) | listingId, dealerId | Permanently removes a listing only when it belongs to the authenticated dealer. Direct named calls: `ListingModel.findOneAndDelete`. |
| `transitionOwnedListingStatus` (line 78) | listingId, dealerId, currentStatus, update | Applies a status change only if the expected current status still matches. Direct named calls: `ListingModel.findOneAndUpdate`. |
| `addOwnedListingImage` (line 83) | listingId, dealerId, image, maximum | Adds image metadata only when the listing is owned and below its image limit. Direct named calls: `ListingModel.findOneAndUpdate`. |
| `removeOwnedListingImage` (line 92) | listingId, dealerId, imageKey | Removes image metadata from a dealer-owned listing. Direct named calls: `ListingModel.findOneAndUpdate`. |
| `restoreOwnedListingImage` (line 101) | listingId, dealerId, image | Restores image metadata when deleting the storage object fails. Direct named calls: `ListingModel.findOneAndUpdate`. |
| `reorderOwnedListingImages` (line 106) | listingId, dealerId, images | Replaces image metadata with a validated dealer-defined order. Direct named calls: `ListingModel.findOneAndUpdate`. |
| `countListingsInScope` (line 113) | scope | No leading explanation comment; read the linked implementation. Direct named calls: `ListingModel.countDocuments`. |
| `updateListingsInScope` (line 119) | scope, eligible, update | Applies one update to every listing in scope whose status allows it. `update` may be an aggregation pipeline, so values can depend on each listing (its price, its first publish date). Direct named calls: `ListingModel.updateMany`, `Array.isArray`. |
| `deleteArchivedListingsInScope` (line 127) | scope | Deletes the archived listings in scope and returns the image keys they held, for storage cleanup. Direct named calls: `ListingModel.find`, `ListingModel.deleteMany`, `listings.map`, `listings.flatMap`. |

---

**[apps/backend/src/modules/marketplace/listing.routes.ts](../apps/backend/src/modules/marketplace/listing.routes.ts)**

Route definitions: inspect the listed registrations and guards. Express routes are mounted by backend app.ts; frontend route arrays are metadata, while app/App.tsx mounts the actual React routes.

Exported declarations: `listingRouter`, `listingImageRouter`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

HTTP registrations (relative to the mount in `app.ts`):

- listingRouter.get("/mine") — line 19
- listingRouter.post("/mine/bulk") — line 20
- listingRouter.get("/mine/stats") — line 21
- listingRouter.get("/mine/:listingId") — line 22
- listingRouter.post("/") — line 23
- listingRouter.patch("/:listingId") — line 24
- listingRouter.patch("/:listingId/status") — line 25
- listingRouter.delete("/:listingId") — line 26
- listingRouter.post("/:listingId/images") — line 27
- listingRouter.delete("/:listingId/images/:imageKey") — line 29
- listingRouter.patch("/:listingId/images/reorder") — line 31
- listingImageRouter.get("/thumbs/:imageKey") — line 34
- listingImageRouter.get("/:imageKey") — line 35

---

**[apps/backend/src/modules/marketplace/listing.service.test.ts](../apps/backend/src/modules/marketplace/listing.service.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `createTestListing` (line 37) | overrides | No leading explanation comment; read the linked implementation. Direct named calls: `createDealerListing`. |

Declared test groups and cases:

- describe: listing service — updateDealerListing (line 26)
- it: clears the description when updated to null (line 50)
- it: still updates the description to a new value (line 59)

---

**[apps/backend/src/modules/marketplace/listing.service.ts](../apps/backend/src/modules/marketplace/listing.service.ts)**

Business operations and orchestration; see each function and its direct calls below.

Exported declarations: `serializeListing`, `assertDealerListingCapacity`, `createDealerListing`, `staleCutoff`, `getDealerListings`, `getDealerListingStats`, `applyBulkListingAction`, `getDealerListing`, `updateDealerListing`, `deleteDealerListing`, `changeDealerListingStatus`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `serializeListing` (line 32) | listing | Converts a listing record into the shared API DTO. Direct named calls: `listing._id.toString`, `listing.dealerId.toString`, `listing.images.slice`, `listing.publishedAt?.toISOString`. |
| `assertRegistrationNotActivelyListed` (line 46) | normalizedRegistrationNumber, excludeListingId | Rejects a registration number that already belongs to a currently listed (draft/active) vehicle. Archived/sold listings don't block — the same physical vehicle may legitimately be relisted. Direct named calls: `findActiveListingByRegistration`. |
| `rethrowAsRegistrationConflict` (line 55) | error | Rethrows a MongoDB duplicate-key error as the same conflict assertRegistrationNotActivelyListed throws, and anything else unchanged. The partial unique index on normalizedRegistrationNumber is the actual race-safety backstop; the pre-check above is just a cheap early rejection for the common non-racing case, so a concurrent request that slips past it still gets the same 409. |
| `assertDealerListingCapacity` (line 62) | dealerId | Refuses new listings once the dealer holds MAX_LISTINGS_PER_DEALER drafts and active listings. Direct named calls: `countOpenDealerListings`. |
| `createDealerListing` (line 68) | dealerId, input | Creates a draft or immediately published listing for a dealer. Direct named calls: `assertDealerListingCapacity`, `normalizeRegistrationNumber`, `assertRegistrationNotActivelyListed`, `generateSearchEmbedding`, `composeListingSearchText`, `createListingRecord`, `input.registrationNumber.trim`, `serializeListing`, `document.toObject`, `rethrowAsRegistrationConflict`. |
| `staleCutoff` (line 87) | now | Active listings last confirmed before this moment are stale stock. Direct named calls: `now.getTime`. |
| `getDealerListings` (line 90) | dealerId, query | Returns every listing owned by the authenticated dealer (optionally only stale stock, or one upload's listings). Direct named calls: `listDealerListings`, `staleCutoff`, `documents.map`, `buildPaginationMeta`. |
| `getDealerListingStats` (line 96) | dealerId | No leading explanation comment; read the linked implementation. Direct named calls: `countDealerListings`, `staleCutoff`. |
| `applyBulkListingAction` (line 103) | dealerId, input | Applies one action to many of the dealer's own listings at once. Each listing is only changed when the action applies to its current status (the same lifecycle rules as one-by-one changes); the others are counted as skipped. Another dealer's listing IDs simply never match. Direct named calls: `countListingsInScope`, `updateListingsInScope`, `deleteArchivedListingsInScope`, `Promise.allSettled`, `imageKeys.map`, `console.error`. |
| `getDealerListing` (line 140) | listingId, dealerId | Returns one listing for its owner, including drafts and archived records for dealer preview/editing. Direct named calls: `findOwnedListing`, `serializeListing`, `listing.toObject`. |
| `updateDealerListing` (line 147) | listingId, dealerId, input | Updates editable fields while preserving listing ownership, category, and status. Direct named calls: `findOwnedListing`, `Object.entries`, `normalizeRegistrationNumber`, `assertRegistrationNotActivelyListed`, `input.registrationNumber.trim`, `validateAttributesForCategory`, `result.error.issues.map`, `searchableFields.some`, `existing.toObject`, `generateSearchEmbedding`, `composeListingSearchText`, `updateOwnedListing`, `serializeListing`, `listing.toObject`. |
| `deleteDealerListing` (line 191) | listingId, dealerId | Permanently removes an owned listing and best-effort cleans up its stored images. Direct named calls: `deleteOwnedListing`, `Promise.allSettled`, `listing.images.map`, `console.error`. |
| `changeDealerListingStatus` (line 203) | listingId, dealerId, nextStatus | Enforces the listing lifecycle before applying an atomic status transition. Direct named calls: `findOwnedListing`, `assertRegistrationNotActivelyListed`, `transitionOwnedListingStatus`, `serializeListing`, `listing.toObject`, `rethrowAsRegistrationConflict`. |

---

**[apps/backend/src/modules/marketplace/listing.validation.test.ts](../apps/backend/src/modules/marketplace/listing.validation.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: registration number normalization (line 5)
- it: normalizes hyphens, spaces, and casing to the same identity (line 6)
- describe: listing request validation (line 15)
- it: applies safe pagination defaults (line 16)
- it: rejects pagination outside its allowed range (line 20)
- it: parses location and mileage filters and rejects inverted ranges (line 25)
- it: requires at least one field when updating a listing (line 31)
- it: only accepts statuses controlled by the dealer workflow (line 36)
- it: requires at least one image key when reordering (line 41)
- describe: create listing category validation (line 47)
- it: accepts a petrol car with engine capacity (line 48)
- it: rejects an electric car missing battery capacity/range (line 53)
- it: rejects a petrol/diesel car missing engine capacity (line 58)
- it: rejects a listing whose attributes belong to the wrong category (line 63)
- it: requires a registration number (line 68)

---

**[apps/backend/src/modules/marketplace/listing.validation.ts](../apps/backend/src/modules/marketplace/listing.validation.ts)**

Validation rules and related types; these reject or normalize unsupported input.

Exported declarations: `listListingsQuerySchema`, `listMyListingsQuerySchema`, `bulkListingActionBodySchema`, `createListingBodySchema`, `listingIdParamsSchema`, `updateListingBodySchema`, `updateListingStatusBodySchema`, `listingImageKeyParamsSchema`, `publicListingImageKeyParamsSchema`, `listingImageMetadataSchema`, `reorderListingImagesBodySchema`, `validateAttributesForCategory`, `ListListingsQuery`, `ListMyListingsQuery`, `BulkListingActionBody`, `CreateListingBody`, `UpdateListingBody`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `rangesInOrder` (line 46) | query, context | No leading explanation comment; read the linked implementation. Direct named calls: `context.addIssue`. |
| `validateAttributesForCategory` (line 120) | category, mergedAttributes | No leading explanation comment; read the linked implementation. |

---

**[apps/backend/src/modules/marketplace/listingImage.controller.ts](../apps/backend/src/modules/marketplace/listingImage.controller.ts)**

HTTP boundary: reads request values, calls services, and sends responses.

Exported declarations: `addListingImage`, `deleteListingImage`, `reorderListingImages`, `getListingImageFile`, `getListingThumbFile`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `addListingImage` (line 11) | request, response | Uploads one image to an authenticated dealer's listing. Direct named calls: `addDealerListingImage`, `String`, `sendSuccess`. |
| `deleteListingImage` (line 17) | request, response | Deletes one owned listing image from MongoDB and object storage. Direct named calls: `sendSuccess`, `deleteDealerListingImage`, `String`. |
| `reorderListingImages` (line 22) | request, response | Saves a complete reordered list of image keys for an owned listing. Direct named calls: `sendSuccess`, `reorderDealerListingImages`, `String`. |
| `getListingImageFile` (line 29) | request, response | Serves a listing photo from private storage through a public, read-only endpoint. Used locally and as the fallback when no CDN is configured. The file is streamed straight from storage (not held in memory), and a browser that already has it gets 304 Not Modified with no body. Direct named calls: `sendListingImage`. |
| `getListingThumbFile` (line 32) | request, response | Same as above for the small copy used by cards and phones. Direct named calls: `sendListingImage`. |
| `sendListingImage` (line 34) | request, response, variant | No leading explanation comment; read the linked implementation. Direct named calls: `getListingImageObject`, `String`, `request.header`, `response.status`, `response.setHeader`, `pipeline`. |

---

**[apps/backend/src/modules/marketplace/listingImage.middleware.ts](../apps/backend/src/modules/marketplace/listingImage.middleware.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `uploadSingleListingImage`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `fileFilter` (line 10) | _request, file, callback | No leading explanation comment; read the linked implementation. Direct named calls: `callback`, `storageConfig.allowedImageTypes.has`. |
| `uploadSingleListingImage` (line 16) | request, response, next | Parses one in-memory image and converts Multer failures into validation errors. Direct named calls: `imageUpload`. |

---

**[apps/backend/src/modules/marketplace/listingImage.service.test.ts](../apps/backend/src/modules/marketplace/listingImage.service.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: listing image signatures (line 4)
- it: accepts supported image headers (line 5)
- it: rejects spoofed and unsupported files (line 11)

---

**[apps/backend/src/modules/marketplace/listingImage.service.ts](../apps/backend/src/modules/marketplace/listingImage.service.ts)**

Business operations and orchestration; see each function and its direct calls below.

Exported declarations: `addDealerListingImage`, `deleteDealerListingImage`, `reorderDealerListingImages`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `atPosition` (line 15) | image, order | Copies one image's stored fields with a new position (keeps the small copy's URL). |
| `addDealerListingImage` (line 20) | listingId, dealerId, file, alt | Uploads an image and atomically attaches its metadata to an owned listing. Direct named calls: `hasValidImageSignature`, `findOwnedListing`, `reencodeImage`, `randomUUID`, `Promise.all`, `uploadListingImage`, `deleteListingImageObject`, `addOwnedListingImage`, `serializeListing`, `updated.toObject`. |
| `deleteDealerListingImage` (line 56) | listingId, dealerId, imageKey | Deletes image metadata and storage, restoring metadata if storage fails. Direct named calls: `findOwnedListing`, `listing.images.find`, `removeOwnedListingImage`, `deleteListingImageObject`, `restoreOwnedListingImage`, `updated.images.map`, `reorderOwnedListingImages`, `serializeListing`. |
| `reorderDealerListingImages` (line 71) | listingId, dealerId, imageKeys | Validates a complete key set before saving a new image order. Direct named calls: `findOwnedListing`, `listing.images.map`, `imageKeys.some`, `imageKeys.map`, `reorderOwnedListingImages`, `serializeListing`, `updated.toObject`. |

---

**[apps/backend/src/modules/marketplace/listingImage.signature.ts](../apps/backend/src/modules/marketplace/listingImage.signature.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `hasValidImageSignature`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `hasValidImageSignature` (line 2) | file | Confirms that file bytes match the declared supported image type. Direct named calls: `bytes.subarray`, `Buffer.from`, `bytes.toString`. |

---

**[apps/backend/src/modules/marketplace/listingImage.storage.ts](../apps/backend/src/modules/marketplace/listingImage.storage.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `listingImageObjectKey`, `listingThumbObjectKey`, `ListingImageVariant`, `uploadListingImage`, `ListingImageObject`, `getListingImageObject`, `deleteListingImageObject`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `listingImageObjectKey` (line 9) | key | Listing photos live under their own prefix, separate from private objects (dealer documents, inventory CSVs and zips). That lets a CDN be granted read access to this prefix only. The public image key (used in URLs and on the listing) stays the bare file name. |
| `listingThumbObjectKey` (line 11) | key | The small copy of the same photo (same file name, in the thumbs/ folder). |
| `uploadListingImage` (line 17) | key, body, contentType, variant | Uploads one re-encoded image and returns its public URL. Behind a CDN, S3_PUBLIC_URL is the CDN address (origin path = the prefix); locally it is this API's /listing-images route. Direct named calls: `storageClient.send`, `listingThumbObjectKey`, `listingImageObjectKey`, `encodeURIComponent`. |
| `isNoSuchKey` (line 28) | error | No leading explanation comment; read the linked implementation. |
| `isNotModified` (line 29) | error | No leading explanation comment; read the linked implementation. |
| `getListingImageObject` (line 38) | key, ifNoneMatch, variant | Opens one listing image as a stream (never buffered in full). Photos stored before the prefix existed are read from their old location until the migration script has moved them. Passing the browser's If-None-Match lets storage answer "not modified" without sending bytes. Direct named calls: `listingThumbObjectKey`, `listingImageObjectKey`, `storageClient.send`, `isNotModified`, `isNoSuchKey`, `Object.assign`. |
| `deleteListingImageObject` (line 62) | key | Removes one listing image and its small copy, wherever stored (current prefix or the pre-migration location). Direct named calls: `Promise.all`, `listingImageObjectKey`, `listingThumbObjectKey`. |

---

**[apps/backend/src/modules/marketplace/publicVisibility.ts](../apps/backend/src/modules/marketplace/publicVisibility.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `getHiddenDealerIds`, `invalidateHiddenDealerIds`, `publicDealerFilter`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `getHiddenDealerIds` (line 11) | None | No leading explanation comment; read the linked implementation. Direct named calls: `Date.now`, `AuthUserModel.find`, `suspended.map`. |
| `invalidateHiddenDealerIds` (line 18) | None | No leading explanation comment; read the linked implementation. |
| `publicDealerFilter` (line 21) | None | Filter fragment for listing queries: excludes listings of suspended dealers. Direct named calls: `getHiddenDealerIds`. |

---

**[apps/backend/src/modules/notifications/index.ts](../apps/backend/src/modules/notifications/index.ts)**

Module entry point or re-export barrel; inspect exported symbols/import targets.

Exported declarations: `notificationsModule`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/notifications/notification.controller.ts](../apps/backend/src/modules/notifications/notification.controller.ts)**

HTTP boundary: reads request values, calls services, and sends responses.

Exported declarations: `getMyNotifications`, `getMyUnreadNotificationCount`, `patchMyNotificationRead`, `patchMyNotificationsReadAll`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `getMyNotifications` (line 10) | request, response | Sends the current user's own notification inbox, newest first. Direct named calls: `getNotificationsForUser`, `sendSuccess`. |
| `getMyUnreadNotificationCount` (line 17) | request, response | Sends the badge count used to render the unread bell indicator. Direct named calls: `sendSuccess`, `getUnreadNotificationCount`. |
| `patchMyNotificationRead` (line 22) | request, response | Marks one notification the requesting user owns as read. Direct named calls: `markOneNotificationRead`, `String`, `sendSuccess`. |
| `patchMyNotificationsReadAll` (line 29) | request, response | Marks every unread notification for the requesting user as read. Direct named calls: `markAllNotificationsAsRead`, `sendSuccess`. |

---

**[apps/backend/src/modules/notifications/notification.model.ts](../apps/backend/src/modules/notifications/notification.model.ts)**

Database shapes, Mongoose models, and indexes. Models describe stored documents; they do not open the database connection.

Exported declarations: `Notification`, `NotificationDocument`, `NotificationModel`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/notifications/notification.repository.ts](../apps/backend/src/modules/notifications/notification.repository.ts)**

Persistence operations: reads or writes stored records for the owning feature.

Exported declarations: `createNotification`, `setNotificationEmailStatus`, `listNotificationsForUser`, `countUnreadNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `findAdminUserIds`, `findUserContact`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `createNotification` (line 6) | input | Creates a notification, marking the email leg 'pending' only when the email channel applies. Direct named calls: `NotificationModel.create`, `input.channels.includes`. |
| `setNotificationEmailStatus` (line 10) | notificationId, emailStatus | No leading explanation comment; read the linked implementation. Direct named calls: `NotificationModel.updateOne`. |
| `listNotificationsForUser` (line 14) | userId, page, limit | No leading explanation comment; read the linked implementation. Direct named calls: `Promise.all`, `NotificationModel.find`, `NotificationModel.countDocuments`. |
| `countUnreadNotifications` (line 22) | userId | No leading explanation comment; read the linked implementation. Direct named calls: `NotificationModel.countDocuments`. |
| `markNotificationRead` (line 26) | notificationId, userId | No leading explanation comment; read the linked implementation. Direct named calls: `NotificationModel.findOneAndUpdate`. |
| `markAllNotificationsRead` (line 30) | userId | No leading explanation comment; read the linked implementation. Direct named calls: `NotificationModel.updateMany`. |
| `findAdminUserIds` (line 36) | None | Cross-module read: admin-only triggers (new dealer application, high rejection rate) fan out to every active administrator rather than one fixed recipient. Direct named calls: `AuthUserModel.find`, `admins.map`. |
| `findUserContact` (line 41) | userId | No leading explanation comment; read the linked implementation. Direct named calls: `AuthUserModel.findById`. |

---

**[apps/backend/src/modules/notifications/notification.routes.ts](../apps/backend/src/modules/notifications/notification.routes.ts)**

Route definitions: inspect the listed registrations and guards. Express routes are mounted by backend app.ts; frontend route arrays are metadata, while app/App.tsx mounts the actual React routes.

Exported declarations: `notificationRouter`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

HTTP registrations (relative to the mount in `app.ts`):

- notificationRouter.get("/") — line 14
- notificationRouter.get("/unread-count") — line 15
- notificationRouter.patch("/:notificationId/read") — line 16
- notificationRouter.patch("/read-all") — line 17

---

**[apps/backend/src/modules/notifications/notification.service.ts](../apps/backend/src/modules/notifications/notification.service.ts)**

Business operations and orchestration; see each function and its direct calls below.

Exported declarations: `notifyUploadJobClean`, `notifyImageProcessingClean`, `notifyDealerApplicationSubmitted`, `notifyUploadHighRejectionRate`, `notifyUploadJobFailed`, `notifyUploadJobCompletedWithErrors`, `notifyImageProcessingFailed`, `notifyImageProcessingCompletedWithErrors`, `notifyDealerApplicationDecision`, `notifyListingRemoved`, `notifyAccountSuspended`, `getNotificationsForUser`, `getUnreadNotificationCount`, `markOneNotificationRead`, `markAllNotificationsAsRead`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `serializeNotification` (line 15) | record | No leading explanation comment; read the linked implementation. Direct named calls: `String`. |
| `notify` (line 34) | userId, type, title, message, channels, details | Records one notification. Emails are only queued here (emailStatus 'pending'); the worker's outbox job sends them with retries. A failure to record a notification is logged, never thrown, so it cannot make an already committed action (approval, suspension, removal) look failed. Direct named calls: `createNotification`, `logger.error`, `String`. |
| `notifyMany` (line 42) | userIds, type, title, message, channels | No leading explanation comment; read the linked implementation. Direct named calls: `Promise.all`, `userIds.map`. |
| `notifyUploadJobClean` (line 48) | dealerUserId | -- In-app only -------------------------------------------------------------------------- Direct named calls: `notify`. |
| `notifyImageProcessingClean` (line 52) | dealerUserId | No leading explanation comment; read the linked implementation. Direct named calls: `notify`. |
| `notifyDealerApplicationSubmitted` (line 56) | businessName, resubmitted | No leading explanation comment; read the linked implementation. Direct named calls: `findAdminUserIds`, `notifyMany`. |
| `notifyUploadHighRejectionRate` (line 63) | uploadJobId, rejectionRate | No leading explanation comment; read the linked implementation. Direct named calls: `findAdminUserIds`, `notifyMany`, `Math.round`. |
| `notifyUploadJobFailed` (line 70) | dealerUserId, reason | -- In-app + email ------------------------------------------------------------------------- Direct named calls: `notify`. |
| `notifyUploadJobCompletedWithErrors` (line 74) | dealerUserId, rejectedRecords | No leading explanation comment; read the linked implementation. Direct named calls: `notify`. |
| `notifyImageProcessingFailed` (line 78) | dealerUserId, reason | No leading explanation comment; read the linked implementation. Direct named calls: `notify`. |
| `notifyImageProcessingCompletedWithErrors` (line 82) | dealerUserId, unmatchedFolders | No leading explanation comment; read the linked implementation. Direct named calls: `notify`. |
| `notifyDealerApplicationDecision` (line 86) | dealerUserId, decision, reason | No leading explanation comment; read the linked implementation. Direct named calls: `notify`. |
| `notifyListingRemoved` (line 92) | dealerUserId, listingTitle, details | No leading explanation comment; read the linked implementation. Direct named calls: `notify`. |
| `notifyAccountSuspended` (line 98) | userId | -- Email-primary -------------------------------------------------------------------------- Direct named calls: `notify`. |
| `getNotificationsForUser` (line 104) | userId, page, limit | -- Reads for the notifications API --------------------------------------------------------- Direct named calls: `listNotificationsForUser`, `result.documents.map`, `buildPaginationMeta`. |
| `getUnreadNotificationCount` (line 109) | userId | No leading explanation comment; read the linked implementation. Direct named calls: `countUnreadNotifications`. |
| `markOneNotificationRead` (line 113) | notificationId, userId | No leading explanation comment; read the linked implementation. Direct named calls: `markNotificationRead`. |
| `markAllNotificationsAsRead` (line 117) | userId | No leading explanation comment; read the linked implementation. Direct named calls: `markAllNotificationsRead`. |

---

**[apps/backend/src/modules/notifications/notification.validation.ts](../apps/backend/src/modules/notifications/notification.validation.ts)**

Validation rules and related types; these reject or normalize unsupported input.

Exported declarations: `listNotificationsQuerySchema`, `ListNotificationsQuery`, `notificationIdParamsSchema`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/search/index.ts](../apps/backend/src/modules/search/index.ts)**

Module entry point or re-export barrel; inspect exported symbols/import targets.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/modules/search/search.controller.ts](../apps/backend/src/modules/search/search.controller.ts)**

HTTP boundary: reads request values, calls services, and sends responses.

Exported declarations: `getSearchResults`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `getSearchResults` (line 6) | request, response | No leading explanation comment; read the linked implementation. Direct named calls: `sendSuccess`, `searchListings`. |

---

**[apps/backend/src/modules/search/search.embedding.ts](../apps/backend/src/modules/search/search.embedding.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `generateSearchEmbedding`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `generateSearchEmbedding` (line 5) | text | Query and listing vectors always use the same configured model and dimensions. Direct named calls: `text.trim`, `createLocalSearchEmbedding`, `fetch`, `encodeURIComponent`, `JSON.stringify`, `AbortSignal.timeout`, `normalizeEmbeddingResponse`, `response.json`. |

---

**[apps/backend/src/modules/search/search.queryAnalyzer.test.ts](../apps/backend/src/modules/search/search.queryAnalyzer.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: natural-language search analyzer (line 6)
- it: extracts the SRS-style structured query (line 7)
- it: corrects common make and model typos (line 13)
- it: distinguishes mileage from price and extracts year ranges (line 19)
- describe: search request validation (line 24)
- it: bounds query and pagination work (line 25)
- describe: embedding contract (line 33)
- it: keeps local and provider vectors normalized (line 34)

---

**[apps/backend/src/modules/search/search.queryAnalyzer.ts](../apps/backend/src/modules/search/search.queryAnalyzer.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `AnalyzedSearchQuery`, `analyzeSearchQuery`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `editDistance` (line 17) | left, right | No leading explanation comment; read the linked implementation. Direct named calls: `Array.from`, `Math.min`. |
| `fuzzyVocabularyMatch` (line 30) | token, vocabulary | No leading explanation comment; read the linked implementation. Direct named calls: `vocabulary.map`. |
| `numericAmount` (line 36) | value, unit | No leading explanation comment; read the linked implementation. Direct named calls: `Number`, `value.replace`. |
| `analyzeSearchQuery` (line 45) | rawQuery | Converts a bounded natural-language query into structured constraints plus residual intent. Direct named calls: `rawQuery.toLocaleLowerCase`, `consume`, `working.split`, `makes.includes`, `fuzzyVocabularyMatch`, `models.includes`, `make.replace`, `model.replace`, `tokens.filter`. |
| `analyzeSearchQuery.consume` (line 49) | pattern, action | No leading explanation comment; read the linked implementation. Direct named calls: `working.match`, `action`, `working.replace`. |

---

**[apps/backend/src/modules/search/search.repository.ts](../apps/backend/src/modules/search/search.repository.ts)**

Persistence operations: reads or writes stored records for the owning feature.

Exported declarations: `SearchFilters`, `escapeSearchRegex`, `buildListingFilter`, `buildListingSort`, `listStructuredListings`, `listSearchCandidates`, `listVectorCandidates`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `escapeSearchRegex` (line 28) | value | Buyer input is always escaped before it enters a regular expression. Direct named calls: `value.replace`. |
| `buildListingFilter` (line 31) | options | Produces the single structured-filter definition shared by browse and intelligent search. Direct named calls: `escapeSearchRegex`. |
| `buildListingSort` (line 51) | sortBy | No leading explanation comment; read the linked implementation. |
| `listStructuredListings` (line 60) | options | Keeps result-set work bounded through validated pagination and indexed filters. Direct named calls: `buildListingFilter`, `publicDealerFilter`, `Promise.all`, `ListingModel.find`, `buildListingSort`, `ListingModel.countDocuments`. |
| `listSearchCandidates` (line 70) | options, candidateLimit | Retrieves a bounded lexical pool for application-side hybrid scoring. Direct named calls: `buildListingFilter`, `publicDealerFilter`, `Promise.all`, `ListingModel.find`, `ListingModel.countDocuments`. |
| `buildVectorFilter` (line 79) | options | No leading explanation comment; read the linked implementation. |
| `listVectorCandidates` (line 93) | embedding, options, candidateLimit | Atlas Vector Search is optional at runtime; callers merge these candidates with lexical ones. Direct named calls: `publicDealerFilter`, `ListingModel.aggregate`, `Math.min`, `buildVectorFilter`, `Object.keys`. |

---

**[apps/backend/src/modules/search/search.routes.ts](../apps/backend/src/modules/search/search.routes.ts)**

Route definitions: inspect the listed registrations and guards. Express routes are mounted by backend app.ts; frontend route arrays are metadata, while app/App.tsx mounts the actual React routes.

Exported declarations: `searchRouter`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

HTTP registrations (relative to the mount in `app.ts`):

- searchRouter.get("/") — line 9

---

**[apps/backend/src/modules/search/search.service.ts](../apps/backend/src/modules/search/search.service.ts)**

Business operations and orchestration; see each function and its direct calls below.

Exported declarations: `searchListings`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `lexicalScore` (line 10) | query, listing | No leading explanation comment; read the linked implementation. Direct named calls: `query.toLocaleLowerCase`, `composeListingSearchText`, `tokens.filter`, `content.includes`, `Math.min`. |
| `asRecordId` (line 19) | value | No leading explanation comment; read the linked implementation. Direct named calls: `String`. |
| `matchesFullFilter` (line 21) | document, filters | No leading explanation comment; read the linked implementation. Direct named calls: `equals`, `includes`, `within`. |
| `matchesFullFilter.text` (line 22) | value | No leading explanation comment; read the linked implementation. Direct named calls: `String`. |
| `matchesFullFilter.includes` (line 24) | actual, expected | No leading explanation comment; read the linked implementation. Direct named calls: `text`. |
| `matchesFullFilter.equals` (line 25) | actual, expected | No leading explanation comment; read the linked implementation. Direct named calls: `text`. |
| `matchesFullFilter.within` (line 26) | actual, minimum, maximum | No leading explanation comment; read the linked implementation. Direct named calls: `Number`, `Number.isFinite`. |
| `searchListings` (line 39) | query | Executes structured-only search directly, or bounded hybrid ranking with safe degradation. Direct named calls: `performance.now`, `analyzeSearchQuery`, `Object.values`, `listStructuredListings`, `structured.documents.map`, `buildPaginationMeta`, `Math.round`, `listSearchCandidates`, `Promise.all`, `merged.set`, `asRecordId`, `matchesFullFilter`, `merged.get`, `merged.values`, `ranked.slice`, `Math.min`, `page.map`. |

---

**[apps/backend/src/modules/search/search.validation.ts](../apps/backend/src/modules/search/search.validation.ts)**

Validation rules and related types; these reject or normalize unsupported input.

Exported declarations: `searchQuerySchema`, `SearchQuery`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/routes.ts](../apps/backend/src/routes.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `routes`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/scripts/listingImageMigration.db.test.ts](../apps/backend/src/scripts/listingImageMigration.db.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `listing` (line 18) | None | No leading explanation comment; read the linked implementation. Direct named calls: `ListingModel.create`. |

Declared test groups and cases:

- describe: listing image URL updates (real MongoDB) (line 10)
- it: sets the small-copy URL only on the listed photos, even though their keys contain dots (line 27)
- it: rewrites photo URLs and keeps every other image field (line 37)

---

**[apps/backend/src/scripts/listingImageMigration.test.ts](../apps/backend/src/scripts/listingImageMigration.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `fakeWorld` (line 6) | objects, listings | In-memory bucket and listings standing in for S3 and MongoDB. Direct named calls: `Object.entries`. |
| `fakeWorld.listings` (line 11) | None | No leading explanation comment; read the linked implementation. |
| `fakeWorld.exists` (line 12) | key | No leading explanation comment; read the linked implementation. Direct named calls: `bucket.has`. |
| `fakeWorld.read` (line 13) | key | No leading explanation comment; read the linked implementation. Direct named calls: `bucket.get`. |
| `fakeWorld.write` (line 14) | key, body | No leading explanation comment; read the linked implementation. Direct named calls: `bucket.set`. |
| `fakeWorld.remove` (line 15) | key | No leading explanation comment; read the linked implementation. Direct named calls: `bucket.delete`. |
| `fakeWorld.setImageUrls` (line 16) | id, urls | No leading explanation comment; read the linked implementation. Direct named calls: `urlUpdates.push`. |
| `fakeWorld.setThumbUrls` (line 17) | id, urls | No leading explanation comment; read the linked implementation. Direct named calls: `thumbUpdates.push`. |
| `fakeWorld.log` (line 18) | None | No leading explanation comment; read the linked implementation. |
| `phonePhoto` (line 23) | None | No leading explanation comment; read the linked implementation. Direct named calls: `sharp`. |
| `listings` (line 78) | None | No leading explanation comment; read the linked implementation. |

Declared test groups and cases:

- describe: listing image migration (line 26)
- it: moves old photos under listing-images/ as metadata-free WebP and removes the originals (line 27)
- it: is safe to run again: already migrated photos are skipped (line 39)
- it: changes nothing in a dry run (line 48)
- it: points image URLs at the CDN when asked (line 59)
- it: creates a small copy for photos that have none, at most 800 px, and records its URL (line 67)
- it: reports missing and undecodable objects and leaves them in place (line 82)

---

**[apps/backend/src/scripts/listingImageMigration.ts](../apps/backend/src/scripts/listingImageMigration.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `MigrationDeps`, `MigrationOptions`, `MigrationSummary`, `migrateListingImages`, `imageFieldUpdate`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `isCleanWebp` (line 25) | bytes | True when the stored bytes are already a metadata-free WebP (photos uploaded after re-encoding was introduced), so they can be moved without another lossy re-encode. Direct named calls: `sharp`. |
| `migrateListingImages` (line 35) | deps, options | Moves every listing photo still stored at the bucket root to the listing-images/ prefix, re-encoding it on the way (strips EXIF/GPS, hidden data; caps size). Idempotent: photos already under the prefix are skipped, so the script can be stopped and run again at any time. With publicUrl, also points each stored image URL at that base (e.g. the CDN). Every photo without a small copy (thumbs/) gets one, and its thumbUrl is recorded. Direct named calls: `deps.listings`, `options.publicUrl.replace`, `image.url.slice`, `image.url.lastIndexOf`, `encodeURIComponent`, `deps.exists`, `deps.read`, `deps.log`, `isCleanWebp`, `reencodeImage`, `String`, `deps.write`, `deps.remove`, `Object.keys`, `deps.setImageUrls`, `deps.setThumbUrls`. |
| `imageFieldUpdate` (line 101) | field, values | Update pipeline that sets `field` (url or thumbUrl) on each of a listing's images whose key is in `values`, leaving the other images untouched. The values travel as a literal list of {k, v} pairs matched with $filter: photo keys contain dots ("…jpg"), which MongoDB would otherwise read as field paths and refuse. Direct named calls: `Object.entries`. |

---

**[apps/backend/src/scripts/migrateListingImages.ts](../apps/backend/src/scripts/migrateListingImages.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `notFound` (line 20) | error | No leading explanation comment; read the linked implementation. Direct named calls: `String`. |
| `listings` (line 25) | None | No leading explanation comment; read the linked implementation. Direct named calls: `ListingModel.find`, `String`. |
| `exists` (line 30) | key | No leading explanation comment; read the linked implementation. Direct named calls: `storageClient.send`, `notFound`. |
| `read` (line 34) | key | No leading explanation comment; read the linked implementation. Direct named calls: `storageClient.send`, `Buffer.from`, `object.Body.transformToByteArray`, `notFound`. |
| `write` (line 38) | key, body, contentType | No leading explanation comment; read the linked implementation. Direct named calls: `storageClient.send`. |
| `remove` (line 41) | key | No leading explanation comment; read the linked implementation. Direct named calls: `storageClient.send`. |
| `setImageUrls` (line 42) | listingId, urls | No leading explanation comment; read the linked implementation. Direct named calls: `ListingModel.updateOne`, `imageFieldUpdate`. |
| `setThumbUrls` (line 43) | listingId, urls | No leading explanation comment; read the linked implementation. Direct named calls: `ListingModel.updateOne`, `imageFieldUpdate`. |
| `log` (line 44) | message | No leading explanation comment; read the linked implementation. Direct named calls: `console.warn`. |

---

**[apps/backend/src/server.ts](../apps/backend/src/server.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `shutdown` (line 19) | signal | Stops accepting connections, lets in-flight requests finish, then releases MongoDB and Redis, all within SHUTDOWN_TIMEOUT_MS so the orchestrator never has to kill the process mid-cleanup. Direct named calls: `console.log`, `setTimeout`, `hardExit.unref`, `server.closeIdleConnections`, `Promise.race`, `drained.then`, `clearTimeout`, `console.warn`, `server.closeAllConnections`, `Promise.allSettled`, `disconnectDatabase`, `closeInventoryQueue`, `disconnectRedis`, `results.some`, `console.error`, `process.exit`. |

---

**[apps/backend/src/shared/errors/AppError.ts](../apps/backend/src/shared/errors/AppError.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `AppError`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `constructor` (line 2) | statusCode, code, message, fields | No leading explanation comment; read the linked implementation. Direct named calls: `super`. |

---

**[apps/backend/src/shared/errors/errorCodes.ts](../apps/backend/src/shared/errors/errorCodes.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `errorCodes`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/shared/middleware/errorHandler.ts](../apps/backend/src/shared/middleware/errorHandler.ts)**

Express request middleware: authentication, authorization, validation, limits, or error handling.

Exported declarations: `errorHandler`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `errorHandler` (line 8) | error, request, response, _next | Converts application and unexpected errors into the standard error envelope. Direct named calls: `logger.error`, `request.header`, `response.status`. |

---

**[apps/backend/src/shared/middleware/loadLocalUser.ts](../apps/backend/src/shared/middleware/loadLocalUser.ts)**

Express request middleware: authentication, authorization, validation, limits, or error handling.

Exported declarations: `loadLocalUser`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `loadLocalUser` (line 8) | request, _response, next | Loads or creates the local user associated with the verified Firebase identity. Direct named calls: `next`, `findOrCreateAuthUser`. |

---

**[apps/backend/src/shared/middleware/notFound.ts](../apps/backend/src/shared/middleware/notFound.ts)**

Express request middleware: authentication, authorization, validation, limits, or error handling.

Exported declarations: `notFound`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `notFound` (line 1) | None | No leading explanation comment; read the linked implementation. |

---

**[apps/backend/src/shared/middleware/rateLimits.test.ts](../apps/backend/src/shared/middleware/rateLimits.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `appWith` (line 13) | middleware | No leading explanation comment; read the linked implementation. Direct named calls: `express`, `app.get`, `app.use`. |
| `increment` (line 34) | None | No leading explanation comment; read the linked implementation. |
| `decrement` (line 35) | None | No leading explanation comment; read the linked implementation. |
| `resetKey` (line 36) | None | No leading explanation comment; read the linked implementation. |

HTTP registrations (relative to the mount in `app.ts`):

- app.get("/test") — line 15
- app.get("/test") — line 47
- app.post("/upload") — line 73

Declared test groups and cases:

- describe: rate limits (line 20)
- it: answers 429 in the standard error format once the budget is used up (line 21)
- it: lets requests through when the shared store (Redis) is down, instead of blocking the site (line 32)
- it: can count only successful requests, so rejected uploads do not use up a quota (line 44)
- describe.skipIf(!redisAvailable): rate limits backed by real Redis (line 59)
- it: enforces one shared budget (the default store, as used in production) (line 60)
- describe: upload concurrency gate (line 69)
- it: refuses uploads beyond the in-flight maximum with 503 and Retry-After, then admits again (line 70)

---

**[apps/backend/src/shared/middleware/rateLimits.ts](../apps/backend/src/shared/middleware/rateLimits.ts)**

Express request middleware: authentication, authorization, validation, limits, or error handling.

Exported declarations: `createLimiter`, `apiLimiter`, `searchLimiter`, `uploadBurstLimiter`, `csvDailyQuota`, `photoZipDailyQuota`, `listingPhotoLimiter`, `dealerApplicationLimiter`, `createUploadConcurrencyGate`, `uploadConcurrencyGate`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `redisStore` (line 14) | prefix | Counters live in Redis so every backend instance enforces one shared budget. |
| `redisStore.sendCommand` (line 15) | command, args | No leading explanation comment; read the linked implementation. Direct named calls: `redisClient.call`. |
| `userOrIpKey` (line 20) | request | The authenticated user when known (per-account limits), otherwise the client IP (IPv6 addresses are grouped by /56 subnet so one host cannot dodge the limit by rotating addresses). Direct named calls: `String`, `ipKeyGenerator`. |
| `createLimiter` (line 29) | { name, windowMs, limit, message, code = errorCodes.rateLimited, byUser = false, countSuccessOnly = false, store } | Builds one limiter. On a Redis outage the limiter lets requests through (and logs), because blocking every request would turn a Redis problem into a full outage. Direct named calls: `redisStore`, `rateLimit`. |
| `createLimiter.handler` (line 40) | _request, _response, next | No leading explanation comment; read the linked implementation. Direct named calls: `next`. |
| `createUploadConcurrencyGate` (line 67) | maximum | Caps how many file uploads this instance buffers in memory at once. Runs before the body is read, so an extra upload is refused immediately (503 + Retry-After) instead of using memory. |
| `createUploadConcurrencyGate.release` (line 77) | None | No leading explanation comment; read the linked implementation. |

---

**[apps/backend/src/shared/middleware/requireAuthenticated.ts](../apps/backend/src/shared/middleware/requireAuthenticated.ts)**

Express request middleware: authentication, authorization, validation, limits, or error handling.

Exported declarations: `requireAuthenticated`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `requireAuthenticated` (line 7) | request, _response, next | Allows only authenticated users whose local account is active. Direct named calls: `next`. |

---

**[apps/backend/src/shared/middleware/requireOwnerOrAdmin.ts](../apps/backend/src/shared/middleware/requireOwnerOrAdmin.ts)**

Express request middleware: authentication, authorization, validation, limits, or error handling.

Exported declarations: `requireOwnerOrAdmin`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `requireOwnerOrAdmin` (line 7) | ownerParameter | Allows resource access to its owner or an administrator. |

---

**[apps/backend/src/shared/middleware/requireRole.ts](../apps/backend/src/shared/middleware/requireRole.ts)**

Express request middleware: authentication, authorization, validation, limits, or error handling.

Exported declarations: `requireRole`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `requireRole` (line 8) | roles | Restricts a route to one or more MotorX roles. |

---

**[apps/backend/src/shared/middleware/validateRequest.ts](../apps/backend/src/shared/middleware/validateRequest.ts)**

Express request middleware: authentication, authorization, validation, limits, or error handling.

Exported declarations: `validateRequest`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `validateRequest` (line 13) | schemas | Parses selected request sections and rejects invalid input with HTTP 400. |

---

**[apps/backend/src/shared/middleware/verifyFirebaseToken.test.ts](../apps/backend/src/shared/middleware/verifyFirebaseToken.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `inOneHour` (line 11) | None | No leading explanation comment; read the linked implementation. Direct named calls: `Math.floor`, `Date.now`. |
| `authenticate` (line 12) | token | No leading explanation comment; read the linked implementation. Direct named calls: `vi.fn`, `verifyFirebaseToken`. |

Declared test groups and cases:

- describe: verifyFirebaseToken (line 19)
- it: checks a token (including revocation) with Firebase once, then reuses the result (line 22)
- it: checks with Firebase again after the cache period, so a revoked token stops working (line 34)
- it: never trusts a cached token beyond its own expiry (line 46)
- it: rejects requests without a bearer token and does not cache failures (line 57)

---

**[apps/backend/src/shared/middleware/verifyFirebaseToken.ts](../apps/backend/src/shared/middleware/verifyFirebaseToken.ts)**

Express request middleware: authentication, authorization, validation, limits, or error handling.

Exported declarations: `clearVerifiedTokenCache`, `verifyFirebaseToken`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `cacheKey` (line 18) | token | No leading explanation comment; read the linked implementation. Direct named calls: `createHash`. |
| `clearVerifiedTokenCache` (line 20) | None | No leading explanation comment; read the linked implementation. Direct named calls: `verifiedTokens.clear`. |
| `verifyWithCache` (line 22) | token | No leading explanation comment; read the linked implementation. Direct named calls: `cacheKey`, `Date.now`, `verifiedTokens.get`, `verifiedTokens.delete`, `firebaseAuth.verifyIdToken`, `Math.min`, `verifiedTokens.keys`, `verifiedTokens.set`. |
| `verifyFirebaseToken` (line 40) | request, _response, next | Verifies the bearer token and attaches its Firebase identity to the request. Direct named calls: `authorization?.match`, `next`, `verifyWithCache`. |

---

**[apps/backend/src/shared/responses/apiResponse.ts](../apps/backend/src/shared/responses/apiResponse.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `sendSuccess`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `sendSuccess` (line 5) | response, data, options | Sends the standard MotorX success envelope with optional status and metadata. Direct named calls: `response.status`. |

---

**[apps/backend/src/shared/types/authenticatedRequest.ts](../apps/backend/src/shared/types/authenticatedRequest.ts)**

Type contracts; these describe values for TypeScript and are not database writes or runtime checks by themselves.

Exported declarations: `AuthenticatedRequest`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/shared/utils/asyncHandler.ts](../apps/backend/src/shared/utils/asyncHandler.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `asyncHandler`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `asyncHandler` (line 6) | handler | Forwards rejected controller promises to Express error middleware. |

---

**[apps/backend/src/shared/utils/imageReencode.test.ts](../apps/backend/src/shared/utils/imageReencode.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: reencodeImage (line 7)
- it: rebuilds a JPEG as WebP and removes EXIF metadata such as GPS location (line 8)
- it: applies EXIF orientation before stripping it, so photos stay upright (line 21)
- it: drops data hidden after the image (line 30)
- it: refuses an image over the 40 megapixel cap even though the file is small (line 39)
- it: refuses content that only starts like an image (line 46)
- it: refuses decodable formats that are not allowed, such as SVG and GIF (line 52)
- it: keeps PNG documents as PNG and shrinks them to the requested size (line 60)

---

**[apps/backend/src/shared/utils/imageReencode.ts](../apps/backend/src/shared/utils/imageReencode.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `ReencodeOutput`, `InvalidImageError`, `reencodeImage`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `reencodeImage` (line 14) | input, options | Fully decodes an image and saves a new file from its pixels only. Hidden trailing data, malformed structures, and all metadata (EXIF GPS, camera details) are dropped; the EXIF orientation is applied first so photos stay upright. Images above the pixel cap are refused before decoding, so a small file cannot expand into gigabytes of memory. Direct named calls: `sharp`, `image.metadata`, `decodableFormats.has`, `resized.webp`, `resized.jpeg`, `resized.png`. |

---

**[apps/backend/src/shared/utils/object.ts](../apps/backend/src/shared/utils/object.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `objectUtils`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/shared/utils/pagination.test.ts](../apps/backend/src/shared/utils/pagination.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: buildPaginationMeta (line 4)
- it: calculates the final partial page (line 5)
- it: returns zero pages for an empty collection (line 9)

---

**[apps/backend/src/shared/utils/pagination.ts](../apps/backend/src/shared/utils/pagination.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `buildPaginationMeta`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `buildPaginationMeta` (line 4) | page, limit, total | Builds consistent pagination metadata for collection responses. Direct named calls: `Math.ceil`. |

---

**[apps/backend/src/test/accessControl.journey.test.ts](../apps/backend/src/test/accessControl.journey.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `bearer` (line 23) | name | No leading explanation comment; read the linked implementation. |
| `person` (line 26) | name, role | Creates a signed-in person: Firebase accepts their token, and their local account has this role. Direct named calls: `request`, `bearer`, `AuthUserModel.findOneAndUpdate`. |
| `listingFor` (line 32) | dealerId | No leading explanation comment; read the linked implementation. Direct named calls: `ListingModel.create`. |

Declared test groups and cases:

- describe: access control across dealers, roles, and admin actions (HTTP level, no browser) (line 42)
- describe: dealer B cannot reach dealer A's data by changing IDs (line 78)
- it: cannot view, edit, change status of, or delete the listing (line 81)
- it: cannot add, delete, or reorder the listing's photos (line 91)
- it: cannot see, retry, or attach photos to the upload (line 104)
- it: does not get the listing or upload in their own lists (line 113)
- it: cannot open the dealer's verification documents (line 121)
- describe: public and role boundaries (line 128)
- it: does not show a dealer's draft listing publicly (line 129)
- it: refuses to serve private storage objects through the public image route (line 134)
- it: requires sign-in, and the right role, for dealer and admin areas (line 140)
- it: blocks a suspended account even with a valid token (line 149)
- describe: dealer approval requires a verified email (line 155)
- it: refuses approval until the applicant has verified their email, then approves (line 156)

---

**[apps/backend/src/test/db.safety.test.ts](../apps/backend/src/test/db.safety.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: test database URI safety (line 4)
- it: accepts the local disposable database (line 18)
- it: accepts the Docker disposable database host (line 22)
- it: rejects a non-test database before any connection is attempted (line 26)
- it: rejects a remote Atlas host unless explicitly enabled (line 30)
- it: allows an explicitly approved remote disposable test database (line 34)
- it: rejects unsupported URI schemes (line 38)
- it: requires TEST_MONGODB_URI and never falls back to MONGODB_URI (line 42)
- it: validates the configured test URI before returning it (line 48)

---

**[apps/backend/src/test/db.ts](../apps/backend/src/test/db.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `validateTestMongoUri`, `getSafeTestMongoUri`, `connectTestDb`, `clearTestDb`, `disconnectTestDb`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `validateTestMongoUri` (line 6) | uri, allowRemote | No leading explanation comment; read the linked implementation. Direct named calls: `allowedLocalHosts.has`, `parsed.hostname.toLowerCase`, `parsed.pathname.replace`. |
| `getSafeTestMongoUri` (line 26) | None | No leading explanation comment; read the linked implementation. Direct named calls: `validateTestMongoUri`. |
| `connectTestDb` (line 32) | None | No leading explanation comment; read the linked implementation. Direct named calls: `mongoose.connect`, `getSafeTestMongoUri`. |
| `clearTestDb` (line 36) | None | No leading explanation comment; read the linked implementation. Direct named calls: `Promise.all`, `Object.values`. |
| `disconnectTestDb` (line 42) | None | No leading explanation comment; read the linked implementation. Direct named calls: `mongoose.disconnect`. |

---

**[apps/backend/src/test/dealerLifecycle.journey.test.ts](../apps/backend/src/test/dealerLifecycle.journey.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `bearer` (line 22) | name | No leading explanation comment; read the linked implementation. |
| `person` (line 23) | name, role | No leading explanation comment; read the linked implementation. Direct named calls: `request`, `bearer`, `AuthUserModel.findOneAndUpdate`. |
| `sentStorageKeys` (line 35) | commandName | No leading explanation comment; read the linked implementation. Direct named calls: `mocks.storageSend.mock.calls.filter`. |
| `applicationRequest` (line 37) | name, overrides | No leading explanation comment; read the linked implementation. Direct named calls: `request`, `bearer`, `Object.entries`, `call.field`, `call.attach`. |
| `publishedListing` (line 61) | dealerId | No leading explanation comment; read the linked implementation. Direct named calls: `ListingModel.create`. |
| `visibleIn` (line 73) | None | No leading explanation comment; read the linked implementation. Direct named calls: `JSON.stringify`, `request`, `String`. |
| `upload` (line 150) | fileName, createdAt | No leading explanation comment; read the linked implementation. |

Declared test groups and cases:

- describe: dealer lifecycle (HTTP level) (line 44)
- describe: suspended dealers disappear from public pages (line 60)
- it: hides the listing from browse, detail, and search while suspended, and shows it again after reactivation (line 69)
- describe: dealer profile editing (line 89)
- it: lets an approved dealer update contact details but not the verified business name or registration number (line 90)
- it: validates changes and is only available to approved dealers (line 101)
- describe: applying from an existing account and resubmitting after rejection (line 111)
- it: lets a signed-in buyer apply without creating a new account (line 112)
- it: lets a rejected applicant correct and resubmit, keeping the earlier decision and replacing the old documents (line 119)
- it: does not let an approved dealer submit another application (line 139)
- describe: admin monitoring filters (line 146)
- it: opens one exact upload and filters uploads and audit events by date (line 147)

---

**[apps/backend/src/test/env.ts](../apps/backend/src/test/env.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/backend/src/test/listingTools.journey.test.ts](../apps/backend/src/test/listingTools.journey.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `bearer` (line 20) | name | No leading explanation comment; read the linked implementation. |
| `person` (line 21) | name, role | No leading explanation comment; read the linked implementation. Direct named calls: `request`, `bearer`, `AuthUserModel.findOneAndUpdate`. |
| `vehicle` (line 30) | dealerId, overrides | No leading explanation comment; read the linked implementation. Direct named calls: `ListingModel.create`. |
| `bulk` (line 41) | name, body | No leading explanation comment; read the linked implementation. Direct named calls: `request`, `bearer`. |
| `statusOf` (line 42) | id | No leading explanation comment; read the linked implementation. Direct named calls: `ListingModel.findById`. |

Declared test groups and cases:

- describe: dealer listing tools and buyer discovery (HTTP level) (line 44)
- describe: bulk actions (line 60)
- it: publishes every chosen draft in one request, and skips listings the action does not apply to (line 61)
- it: publishes all drafts from one CSV upload without listing their IDs (line 79)
- it: never touches another dealer's listings, even when their IDs are sent (line 91)
- it: marks sold, archives, and reduces prices by a percentage (line 102)
- it: deletes only archived listings, and removes their photos and small copies from storage (line 115)
- it: rejects a request mixing chosen IDs with an upload, and a price cut without a percentage (line 129)
- it: is for dealers only (line 137)
- describe: stale stock (line 143)
- it: counts and lists active listings not confirmed for 60 days, oldest first (line 144)
- it: treats listings saved before lastConfirmedAt existed by their last update time (line 158)
- it: "still available", a price cut, or an edit makes a listing fresh again (line 168)
- describe: similar vehicles and recommendations (line 182)
- it: ranks the closest vehicles first and never includes the vehicle itself or hidden listings (line 183)
- it: recommends vehicles like the ones this browser viewed, leaving out the viewed ones (line 201)
- it: returns nothing (not an error) when no viewed vehicle can be found (line 218)
- it: rejects a malformed viewed list (line 224)
- it: serves the small copy of a photo from the thumbs/ folder (line 229)

---

**[apps/backend/vitest.config.ts](../apps/backend/vitest.config.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/app/App.tsx](../apps/frontend/src/app/App.tsx)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `App`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `App` (line 33) | None | No leading explanation comment; read the linked implementation. |

---

**[apps/frontend/src/app/LandingPage.tsx](../apps/frontend/src/app/LandingPage.tsx)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `LandingPage`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `LandingPage` (line 8) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useState`, `useNavigate`, `useI18n`, `useBuyerListings`, `t`, `featuredListings.map`. |
| `LandingPage.handleSearchSubmit` (line 14) | e | No leading explanation comment; read the linked implementation. Direct named calls: `e.preventDefault`, `searchQuery.trim`, `navigate`, `encodeURIComponent`. |

---

**[apps/frontend/src/app/providers.tsx](../apps/frontend/src/app/providers.tsx)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `AppProviders`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `AppProviders` (line 10) | { children } | No leading explanation comment; read the linked implementation. |

---

**[apps/frontend/src/app/router.tsx](../apps/frontend/src/app/router.tsx)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `router`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/app/theme/ThemeProvider.tsx](../apps/frontend/src/app/theme/ThemeProvider.tsx)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `ThemeMode`, `ThemeContext`, `ThemeProvider`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `getInitialTheme` (line 15) | None | No leading explanation comment; read the linked implementation. Direct named calls: `window.localStorage.getItem`, `window.matchMedia`. |
| `ThemeProvider` (line 28) | { children } | No leading explanation comment; read the linked implementation. Direct named calls: `useState`, `useEffect`, `useMemo`. |
| `ThemeProvider.toggleTheme` (line 39) | None | No leading explanation comment; read the linked implementation. Direct named calls: `setThemeState`. |

---

**[apps/frontend/src/app/theme/ThemeToggle.tsx](../apps/frontend/src/app/theme/ThemeToggle.tsx)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `ThemeToggle`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `SunIcon` (line 4) | None | No leading explanation comment; read the linked implementation. |
| `MoonIcon` (line 10) | None | No leading explanation comment; read the linked implementation. |
| `ThemeToggle` (line 16) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useTheme`. |

---

**[apps/frontend/src/app/theme/useTheme.ts](../apps/frontend/src/app/theme/useTheme.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `useTheme`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `useTheme` (line 4) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useContext`. |

---

**[apps/frontend/src/config/env.ts](../apps/frontend/src/config/env.ts)**

Configuration, validated environment settings, or a shared external-service client.

Exported declarations: `env`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/config/firebase.ts](../apps/frontend/src/config/firebase.ts)**

Configuration, validated environment settings, or a shared external-service client.

Exported declarations: `firebaseConfig`, `firebaseApp`, `firebaseAuthClient`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/config/routes.ts](../apps/frontend/src/config/routes.ts)**

Configuration, validated environment settings, or a shared external-service client.

Exported declarations: `routes`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `vehicleDetails` (line 6) | id | No leading explanation comment; read the linked implementation. |
| `dealerUploadDetails` (line 15) | id | No leading explanation comment; read the linked implementation. |

---

**[apps/frontend/src/features/admin/services/adminApi.ts](../apps/frontend/src/features/admin/services/adminApi.ts)**

Frontend API adapter: translates UI requests into HTTP calls and extracts response data.

Exported declarations: `AdminUser`, `AdminUserDetails`, `AdminUploadRecord`, `AdminListing`, `AdminStats`, `AdminAuditEvent`, `AdminAuditLog`, `AdminUpload`, `AdminSystemHealth`, `AdminUserFilters`, `AdminListingFilters`, `AdminUploadFilters`, `AdminAuditFilters`, `adminApi`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `getUserDetails` (line 36) | userId | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`. |
| `listUploadRecords` (line 39) | uploadId, outcome, page | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`. |
| `listUsers` (line 43) | filters | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`. |
| `setUserStatus` (line 47) | userId, status | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.patch`. |
| `listListings` (line 51) | filters | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`. |
| `removeListing` (line 55) | listingId | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.delete`. |
| `getStats` (line 59) | None | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`. |
| `listAuditLogs` (line 63) | filters | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`. |
| `listUploads` (line 67) | filters | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`. |
| `getSystemHealth` (line 71) | None | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`. |

---

**[apps/frontend/src/features/auth/components/EmailVerificationBanner.test.tsx](../apps/frontend/src/features/auth/components/EmailVerificationBanner.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `renderFor` (line 11) | user | Renders the banner as if Firebase reported this signed-in user (or nobody). Direct named calls: `firebaseAuth.onUserChanged.mockImplementation`, `render`. |

Declared test groups and cases:

- describe: EmailVerificationBanner (line 16)
- it: is hidden when nobody is signed in or the email is verified (line 19)
- it: asks an unverified user to verify, and can resend the email (line 26)
- it: disappears once the user has verified (line 37)
- it: explains when the link has not been opened yet (line 46)

---

**[apps/frontend/src/features/auth/components/EmailVerificationBanner.tsx](../apps/frontend/src/features/auth/components/EmailVerificationBanner.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `EmailVerificationBanner`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `EmailVerificationBanner` (line 6) | None | Shown to signed-in users whose email address is not verified yet. Buyers can use MotorX without it, but a dealer application cannot be approved until the applicant has verified their email. Direct named calls: `useState`, `useEffect`. |
| `EmailVerificationBanner.run` (line 19) | action | No leading explanation comment; read the linked implementation. Direct named calls: `setBusy`, `setMessage`, `action`. |

---

**[apps/frontend/src/features/auth/components/LoginForm.test.tsx](../apps/frontend/src/features/auth/components/LoginForm.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `useAuth` (line 7) | None | No leading explanation comment; read the linked implementation. |
| `renderLogin` (line 12) | None | No leading explanation comment; read the linked implementation. Direct named calls: `render`. |
| `signIn` (line 22) | email, password | No leading explanation comment; read the linked implementation. Direct named calls: `userEvent.type`, `screen.getByPlaceholderText`, `screen.getByLabelText`, `userEvent.click`, `screen.getByRole`. |

Declared test groups and cases:

- describe: sign-in form (line 28)
- it.each([ [{ role: 'dealer' }, '/dealer'], [{ role: 'admin' }, '/admin'], [{ role: 'buyer' }, '/marketplace'], [{ role: 'buyer', dealerStatus: 'pending' }, '/dealer/application-status'], [{ role: 'buyer', dealerStatus: 'rejected' }, '/dealer/application-status'], ]): sends %o to the right place after signing in (line 31)
- it: explains a wrong password and a lockout in plain words (line 45)
- it: shows and hides the password (line 60)
- it: asks for the email before sending a reset link, then confirms it was sent (line 70)

---

**[apps/frontend/src/features/auth/components/LoginForm.tsx](../apps/frontend/src/features/auth/components/LoginForm.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `LoginForm`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `friendlyMessage` (line 9) | error, t | No leading explanation comment; read the linked implementation. Direct named calls: `String`, `code.includes`, `t`. |
| `LoginForm` (line 16) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useAuth`, `useNavigate`, `useI18n`, `useState`, `t`. |
| `LoginForm.handleSignIn` (line 26) | event | No leading explanation comment; read the linked implementation. Direct named calls: `event.preventDefault`, `setMessage`, `setIsSubmitting`, `login`, `email.trim`, `navigate`, `friendlyMessage`. |
| `LoginForm.handlePasswordReset` (line 48) | None | No leading explanation comment; read the linked implementation. Direct named calls: `email.trim`, `setMessage`, `t`, `firebaseAuth.sendPasswordReset`, `friendlyMessage`. |

---

**[apps/frontend/src/features/auth/components/PortalRedirect.tsx](../apps/frontend/src/features/auth/components/PortalRedirect.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `PortalRedirect`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `PortalRedirect` (line 5) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useAuth`. |

---

**[apps/frontend/src/features/auth/components/ProtectedRoute.tsx](../apps/frontend/src/features/auth/components/ProtectedRoute.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `ProtectedRoute`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `ProtectedRoute` (line 5) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useAuth`. |

---

**[apps/frontend/src/features/auth/components/RoleGuard.test.tsx](../apps/frontend/src/features/auth/components/RoleGuard.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `renderDealerPage` (line 11) | None | Renders a dealer-only page behind the guard, plus the pages it may redirect to. Direct named calls: `render`. |

Declared test groups and cases:

- describe: RoleGuard (line 25)
- it: sends signed-out visitors to the login page (line 26)
- it: shows the page to a user with an allowed role (line 32)
- it: shows "Access Restricted" to a signed-in user without the role (line 38)
- it: sends an applicant whose dealer application is still pending to the status page (line 45)

---

**[apps/frontend/src/features/auth/components/RoleGuard.tsx](../apps/frontend/src/features/auth/components/RoleGuard.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `RoleGuard`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `RoleGuard` (line 10) | { allowedRoles } | No leading explanation comment; read the linked implementation. Direct named calls: `useAuth`, `allowedRoles.includes`. |

---

**[apps/frontend/src/features/auth/context/AuthProvider.test.tsx](../apps/frontend/src/features/auth/context/AuthProvider.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `onAuthStateChanged` (line 6) | listener | No leading explanation comment; read the linked implementation. |
| `LogoutButton` (line 13) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useAuth`. |

Declared test groups and cases:

- describe: AuthProvider cached data (line 15)
- it: clears the previous account's cached data on sign-out, so the next user never sees it (line 18)
- it: clears cached data when a different account signs in on the same browser (line 32)

---

**[apps/frontend/src/features/auth/context/AuthProvider.tsx](../apps/frontend/src/features/auth/context/AuthProvider.tsx)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `AuthContext`, `AuthProvider`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `loadUserWithDealerStatus` (line 12) | None | No leading explanation comment; read the linked implementation. Direct named calls: `authApi.getCurrentUser`, `getMyDealerApplication`. |
| `AuthProvider` (line 24) | { children } | No leading explanation comment; read the linked implementation. Direct named calls: `useState`, `useQueryClient`, `useRef`, `useEffect`. |
| `AuthProvider.switchAccount` (line 33) | next | Cached API data (uploads, listings, notifications...) belongs to one account. Drop it whenever the signed-in account changes, including sign-out, so the next person on this browser never sees the previous user's data, even briefly. Direct named calls: `queryClient.clear`, `setUser`. |
| `AuthProvider.login` (line 56) | email, password | No leading explanation comment; read the linked implementation. Direct named calls: `firebaseAuth.signInWithEmail`, `loadUserWithDealerStatus`, `switchAccount`, `firebaseAuth.signOut`. |
| `AuthProvider.registerBuyer` (line 69) | data | No leading explanation comment; read the linked implementation. Direct named calls: `firebaseAuth.registerWithEmail`, `authApi.getCurrentUser`, `switchAccount`, `authApi.updateProfile`. |
| `AuthProvider.registerDealerApplication` (line 75) | data | No leading explanation comment; read the linked implementation. Direct named calls: `firebaseAuth.registerWithEmail`, `authApi.getCurrentUser`, `authApi.updateProfile`, `submitDealerApplication`, `toDealerApplicationPayload`, `firebaseAuth.signOut`, `switchAccount`, `firebaseAuth.deleteCurrentUser`. |
| `AuthProvider.logout` (line 97) | None | No leading explanation comment; read the linked implementation. Direct named calls: `firebaseAuth.signOut`, `switchAccount`. |
| `AuthProvider.refreshUser` (line 103) | None | Reloads the signed-in user (e.g. after submitting a dealer application from an existing account). Direct named calls: `loadUserWithDealerStatus`, `switchAccount`. |

---

**[apps/frontend/src/features/auth/hooks/useAuth.ts](../apps/frontend/src/features/auth/hooks/useAuth.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `useAuth`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `useAuth` (line 5) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useContext`. |

---

**[apps/frontend/src/features/auth/pages/DealerPendingPage.tsx](../apps/frontend/src/features/auth/pages/DealerPendingPage.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `DealerPendingPage`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `DealerPendingPage` (line 7) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useLocation`, `useAuth`, `useState`, `useEffect`, `status.replace`. |

---

**[apps/frontend/src/features/auth/pages/LoginPage.tsx](../apps/frontend/src/features/auth/pages/LoginPage.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `LoginPage`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `LoginPage` (line 5) | None | No leading explanation comment; read the linked implementation. |

---

**[apps/frontend/src/features/auth/pages/RegisterPage.test.tsx](../apps/frontend/src/features/auth/pages/RegisterPage.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `renderForSignedInBuyer` (line 19) | None | No leading explanation comment; read the linked implementation. Direct named calls: `mocks.useAuth.mockReturnValue`, `vi.fn`, `render`. |

Declared test groups and cases:

- describe: RegisterPage for a signed-in buyer (line 24)
- it: shows the rejection reason, pre-fills the previous answers, and asks for no password (line 27)
- it: resubmits from the existing account with the new documents (line 38)
- it: sends an applicant whose application is still pending to the status page (line 56)

---

**[apps/frontend/src/features/auth/pages/RegisterPage.tsx](../apps/frontend/src/features/auth/pages/RegisterPage.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `RegisterPage`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `RegisterPage` (line 12) | { mode = 'buyer' } | No leading explanation comment; read the linked implementation. Direct named calls: `useAuth`, `useNavigate`, `useState`, `useEffect`. |
| `RegisterPage.handleBuyerChange` (line 81) | field, value | No leading explanation comment; read the linked implementation. Direct named calls: `setBuyerForm`. |
| `RegisterPage.handleDealerChange` (line 85) | field, value | No leading explanation comment; read the linked implementation. Direct named calls: `setDealerForm`. |
| `RegisterPage.handleBuyerSubmit` (line 89) | event | No leading explanation comment; read the linked implementation. Direct named calls: `event.preventDefault`, `setError`, `setIsSubmitting`, `registerBuyer`, `navigate`. |
| `RegisterPage.submitAsSignedInBuyer` (line 122) | None | Submits (or resubmits) the application from the signed-in buyer's existing account. Direct named calls: `setError`, `setIsSubmitting`, `submitDealerApplication`, `toDealerApplicationPayload`, `refreshUser`, `navigate`. |
| `RegisterPage.handleDealerSubmit` (line 142) | event | No leading explanation comment; read the linked implementation. Direct named calls: `event.preventDefault`, `setError`, `submitAsSignedInBuyer`, `setIsSubmitting`, `registerDealerApplication`, `navigate`. |

---

**[apps/frontend/src/features/auth/services/authApi.ts](../apps/frontend/src/features/auth/services/authApi.ts)**

Frontend API adapter: translates UI requests into HTTP calls and extracts response data.

Exported declarations: `authApi`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `toFrontendUser` (line 5) | user | No leading explanation comment; read the linked implementation. Direct named calls: `user.email.split`. |
| `getCurrentUser` (line 20) | None | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`, `toFrontendUser`. |
| `updateProfile` (line 24) | displayName, phone | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.patch`, `toFrontendUser`. |

---

**[apps/frontend/src/features/auth/services/firebaseAuth.ts](../apps/frontend/src/features/auth/services/firebaseAuth.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `firebaseAuth`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `signInWithEmail` (line 5) | email, password | No leading explanation comment; read the linked implementation. Direct named calls: `signInWithEmailAndPassword`. |
| `registerWithEmail` (line 8) | email, password, displayName | No leading explanation comment; read the linked implementation. Direct named calls: `createUserWithEmailAndPassword`, `updateProfile`, `sendEmailVerification`, `credential.user.getIdToken`. |
| `getIdToken` (line 18) | None | No leading explanation comment; read the linked implementation. Direct named calls: `firebaseAuthClient.currentUser?.getIdToken`. |
| `signOut` (line 21) | None | No leading explanation comment; read the linked implementation. Direct named calls: `signOut`. |
| `deleteCurrentUser` (line 23) | None | No leading explanation comment; read the linked implementation. Direct named calls: `deleteUser`. |
| `sendPasswordReset` (line 27) | email | No leading explanation comment; read the linked implementation. Direct named calls: `sendPasswordResetEmail`. |
| `resendEmailVerification` (line 29) | None | No leading explanation comment; read the linked implementation. Direct named calls: `sendEmailVerification`. |
| `refreshEmailVerification` (line 35) | None | Reloads the account after the user clicked the link in the email, and refreshes the ID token so the backend sees the new email_verified claim. Returns whether the email is now verified. Direct named calls: `user.reload`, `user.getIdToken`. |
| `onUserChanged` (line 43) | callback | No leading explanation comment; read the linked implementation. Direct named calls: `onIdTokenChanged`. |
| `onAuthStateChanged` (line 45) | callback | No leading explanation comment; read the linked implementation. Direct named calls: `onAuthStateChanged`. |

---

**[apps/frontend/src/features/auth/types/auth.types.ts](../apps/frontend/src/features/auth/types/auth.types.ts)**

Type contracts; these describe values for TypeScript and are not database writes or runtime checks by themselves.

Exported declarations: `UserRole`, `DealerStatus`, `BuyerRegistrationInput`, `DealerApplicationInput`, `DealerApplication`, `User`, `DealerProfile`, `AuthState`, `AuthContextValue`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/features/buyers/buyer.constants.ts](../apps/frontend/src/features/buyers/buyer.constants.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `buyerVehicleMakes`, `buyerFuelTypes`, `buyerVehicleCategories`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/features/buyers/hooks/useBuyerListing.ts](../apps/frontend/src/features/buyers/hooks/useBuyerListing.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `useBuyerListing`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `useBuyerListing` (line 5) | id | Loads one buyer-visible listing only when an ID is available. Direct named calls: `useQuery`, `Boolean`. |
| `useBuyerListing.queryFn` (line 5) | None | No leading explanation comment; read the linked implementation. Direct named calls: `buyerApi.getVehicle`. |

---

**[apps/frontend/src/features/buyers/hooks/useBuyerListings.ts](../apps/frontend/src/features/buyers/hooks/useBuyerListings.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `useBuyerListings`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `useBuyerListings` (line 9) | initialFilters, pageSize | Groups marketplace filtering and pagination state for buyer screens. Direct named calls: `useState`, `useQuery`, `useCallback`. |
| `useBuyerListings.queryFn` (line 11) | None | No leading explanation comment; read the linked implementation. Direct named calls: `buyerApi.searchVehicles`, `buyerApi.listVehicles`. |
| `useBuyerListings.placeholderData` (line 11) | previous | No leading explanation comment; read the linked implementation. |

---

**[apps/frontend/src/features/buyers/services/buyerApi.ts](../apps/frontend/src/features/buyers/services/buyerApi.ts)**

Frontend API adapter: translates UI requests into HTTP calls and extracts response data.

Exported declarations: `buyerApi`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `toBuyerListing` (line 11) | dto, dealer | Converts the shared API contract into the buyer UI model. Direct named calls: `dto.images.map`. |
| `listVehicles` (line 22) | filters, page, limit | Loads active marketplace vehicles with pagination inside response data. Direct named calls: `apiClient.get`, `listings.map`. |
| `searchVehicles` (line 27) | filters, page, limit | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`, `listings.map`. |
| `getSimilarVehicles` (line 33) | listingId, limit | Public vehicles most like one vehicle (same kind, closest make, model, price and age). Direct named calls: `apiClient.get`, `response.data.data.listings.map`. |
| `getRecommendedVehicles` (line 38) | viewedIds, limit | Vehicles matched to the ones this browser viewed recently (newest first). Nothing is stored server-side. Direct named calls: `apiClient.get`, `viewedIds.join`, `response.data.data.listings.map`. |
| `getVehicle` (line 44) | listingId | Loads one active vehicle, with its dealer's public profile, for the details page. Direct named calls: `apiClient.get`, `toBuyerListing`. |

---

**[apps/frontend/src/features/compare/CompareProvider.tsx](../apps/frontend/src/features/compare/CompareProvider.tsx)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `MAX_COMPARE`, `CompareProvider`, `useCompare`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `CompareProvider` (line 20) | { children } | The vehicles a buyer has picked to compare. Kept in this browser only, so the list survives page changes and reloads without an account. Direct named calls: `useState`, `useCallback`, `useMemo`. |
| `CompareProvider.has` (line 27) | id | No leading explanation comment; read the linked implementation. Direct named calls: `ids.includes`. |
| `CompareProvider.toggle` (line 28) | id | No leading explanation comment; read the linked implementation. Direct named calls: `ids.includes`, `save`, `ids.filter`. |
| `CompareProvider.remove` (line 34) | id | No leading explanation comment; read the linked implementation. Direct named calls: `save`, `ids.filter`. |
| `CompareProvider.clear` (line 35) | None | No leading explanation comment; read the linked implementation. Direct named calls: `save`. |
| `has` (line 41) | None | No leading explanation comment; read the linked implementation. |
| `toggle` (line 41) | None | No leading explanation comment; read the linked implementation. |
| `remove` (line 41) | None | No leading explanation comment; read the linked implementation. |
| `clear` (line 41) | None | No leading explanation comment; read the linked implementation. |
| `useCompare` (line 44) | None | Outside a provider (isolated component tests) comparing is simply unavailable. Direct named calls: `useContext`. |

---

**[apps/frontend/src/features/compare/CompareToggle.tsx](../apps/frontend/src/features/compare/CompareToggle.tsx)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `CompareToggle`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `CompareToggle` (line 7) | { listingId, title, className } | Adds a vehicle to, or removes it from, the compare list. When the list is full it says so instead of silently doing nothing. Direct named calls: `useCompare`, `useI18n`, `useState`, `has`, `t`. |
| `CompareToggle.onClick` (line 13) | event | No leading explanation comment; read the linked implementation. Direct named calls: `event.preventDefault`, `event.stopPropagation`, `toggle`, `setFull`, `window.setTimeout`. |

---

**[apps/frontend/src/features/compare/CompareTray.tsx](../apps/frontend/src/features/compare/CompareTray.tsx)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `CompareTray`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `CompareTray` (line 9) | None | A bar along the bottom of the buyer pages while vehicles are picked for comparison. Hidden on the compare page itself, which already shows them. Direct named calls: `useCompare`, `useI18n`, `useLocation`, `useBodyClass`, `t`, `ids.join`. |

---

**[apps/frontend/src/features/compare/compare.test.tsx](../apps/frontend/src/features/compare/compare.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `id` (line 15) | n | No leading explanation comment; read the linked implementation. Direct named calls: `String`. |
| `vehicle` (line 16) | n, overrides | No leading explanation comment; read the linked implementation. Direct named calls: `id`. |
| `renderWith` (line 22) | ui, path | No leading explanation comment; read the linked implementation. Direct named calls: `render`. |

Declared test groups and cases:

- describe: compare vehicles (line 38)
- it: collects up to three vehicles, says when the list is full, and opens the comparison (line 41)
- it: shows vehicles side by side and highlights the best price, year and mileage (line 56)
- it: says so when a vehicle is no longer available (line 70)
- it: picks the best value only when the vehicles differ (line 76)

---

**[apps/frontend/src/features/dealers/schemas/dealer.schema.ts](../apps/frontend/src/features/dealers/schemas/dealer.schema.ts)**

Validation rules and related types; these reject or normalize unsupported input.

Exported declarations: `dealerApplicationSchema`, `dealerResponseSchema`, `dealerListResponseSchema`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/features/dealers/services/dealerApi.ts](../apps/frontend/src/features/dealers/services/dealerApi.ts)**

Frontend API adapter: translates UI requests into HTTP calls and extracts response data.

Exported declarations: `submitDealerApplication`, `getDealerDocumentUrl`, `openDealerDocument`, `getMyDealerApplication`, `getPendingDealerApplications`, `approveDealerApplication`, `rejectDealerApplication`, `DealerProfileUpdate`, `updateMyDealerProfile`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `submitDealerApplication` (line 5) | input, documents | No leading explanation comment; read the linked implementation. Direct named calls: `Object.entries`, `form.append`, `dealerResponseSchema.parse`, `apiClient.post`. |
| `getDealerDocumentUrl` (line 19) | dealerId, documentIndex | No leading explanation comment; read the linked implementation. |
| `openDealerDocument` (line 21) | dealerId, documentIndex | No leading explanation comment; read the linked implementation. Direct named calls: `window.open`, `apiClient.get`, `getDealerDocumentUrl`, `URL.createObjectURL`, `window.setTimeout`, `tab?.close`. |
| `getMyDealerApplication` (line 34) | None | No leading explanation comment; read the linked implementation. Direct named calls: `dealerResponseSchema.parse`, `apiClient.get`. |
| `getPendingDealerApplications` (line 37) | status | No leading explanation comment; read the linked implementation. Direct named calls: `dealerListResponseSchema.parse`, `apiClient.get`. |
| `approveDealerApplication` (line 40) | dealerId | No leading explanation comment; read the linked implementation. Direct named calls: `dealerResponseSchema.parse`, `apiClient.patch`. |
| `rejectDealerApplication` (line 43) | dealerId, reason | No leading explanation comment; read the linked implementation. Direct named calls: `dealerResponseSchema.parse`, `apiClient.patch`. |
| `updateMyDealerProfile` (line 48) | input | No leading explanation comment; read the linked implementation. Direct named calls: `dealerResponseSchema.parse`, `apiClient.patch`. |

---

**[apps/frontend/src/features/dealers/types/dealer.types.ts](../apps/frontend/src/features/dealers/types/dealer.types.ts)**

Type contracts; these describe values for TypeScript and are not database writes or runtime checks by themselves.

Exported declarations: `DealerApplicationStatus`, `DealerApplication`, `CreateDealerApplicationInput`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/features/dealers/utils/applicationPayload.ts](../apps/frontend/src/features/dealers/utils/applicationPayload.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `toDealerApplicationPayload`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `toDealerApplicationPayload` (line 5) | data | Maps the dealer application form to the API payload. Shared by the new-account flow and by signed-in buyers applying (or correcting a rejected application) from their existing account. Direct named calls: `data.brandFocus.split`, `Number`. |

---

**[apps/frontend/src/features/inventory/services/inventoryApi.ts](../apps/frontend/src/features/inventory/services/inventoryApi.ts)**

Frontend API adapter: translates UI requests into HTTP calls and extracts response data.

Exported declarations: `inventoryApi`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `toPaginated` (line 6) | items, pagination | No leading explanation comment; read the linked implementation. |
| `uploadCsv` (line 11) | category, file, onProgress | No leading explanation comment; read the linked implementation. Direct named calls: `formData.append`, `apiClient.post`. |
| `uploadCsv.onUploadProgress` (line 16) | event | No leading explanation comment; read the linked implementation. Direct named calls: `onProgress`, `Math.round`. |
| `downloadTemplate` (line 24) | category | Downloads the category CSV template and returns it as a browser-savable Blob. Direct named calls: `apiClient.get`. |
| `uploadImagesZip` (line 30) | uploadId, file, onProgress | Attaches a vehicle-photos zip (one folder per registration number) to a finished CSV upload. Direct named calls: `formData.append`, `apiClient.post`. |
| `uploadImagesZip.onUploadProgress` (line 34) | event | No leading explanation comment; read the linked implementation. Direct named calls: `onProgress`, `Math.round`. |
| `listUploads` (line 41) | page, limit | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`, `toPaginated`. |
| `getUpload` (line 48) | uploadId | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`. |
| `retryUpload` (line 54) | uploadId | Re-queues a failed CSV import; it resumes from where it stopped without duplicating rows. Direct named calls: `apiClient.post`. |
| `retryImages` (line 60) | uploadId | Re-queues failed photo processing for the zip already uploaded with this job. Direct named calls: `apiClient.post`. |
| `getRejectedRecords` (line 65) | uploadId, page, limit | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`, `toPaginated`. |

---

**[apps/frontend/src/features/inventory/types/inventory.types.ts](../apps/frontend/src/features/inventory/types/inventory.types.ts)**

Type contracts; these describe values for TypeScript and are not database writes or runtime checks by themselves.

Exported declarations: `UploadJobStatus`, `ImageProcessingStatus`, `UploadJob`, `RejectedRecordReason`, `RejectedRecord`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/features/listings/components/ImageCropModal.tsx](../apps/frontend/src/features/listings/components/ImageCropModal.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `ImageCropModal`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `ImageCropModal` (line 17) | { file, onCancel, onConfirm } | Fixed-ratio pan & zoom cropper: the image always fills the frame ("cover"), the dealer can only drag/zoom within it, so the exported crop can never show letterboxing or an off-ratio result. Direct named calls: `useState`, `useRef`, `useCallback`. |
| `ImageCropModal.handleImageLoad` (line 34) | None | No leading explanation comment; read the linked implementation. Direct named calls: `Math.max`, `setNaturalSize`, `setMinScale`, `setScale`, `setOffset`. |
| `ImageCropModal.onPointerDown` (line 44) | event | No leading explanation comment; read the linked implementation. Direct named calls: `event.currentTarget.setPointerCapture`. |
| `ImageCropModal.onPointerMove` (line 49) | event | No leading explanation comment; read the linked implementation. Direct named calls: `setOffset`, `clampOffset`. |
| `ImageCropModal.onPointerUp` (line 56) | None | No leading explanation comment; read the linked implementation. |
| `ImageCropModal.onScaleChange` (line 58) | nextScale | No leading explanation comment; read the linked implementation. Direct named calls: `setScale`, `setOffset`. |
| `ImageCropModal.handleConfirm` (line 63) | None | No leading explanation comment; read the linked implementation. Direct named calls: `document.createElement`, `canvas.getContext`, `ctx.drawImage`, `canvas.toBlob`. |
| `ImageCropModal.handleCancel` (line 86) | None | No leading explanation comment; read the linked implementation. Direct named calls: `URL.revokeObjectURL`, `onCancel`. |

---

**[apps/frontend/src/features/listings/components/ListingCard.tsx](../apps/frontend/src/features/listings/components/ListingCard.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `ListingCard`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `ListingCard` (line 21) | { listing, showStatus = false, comparable = true } | No leading explanation comment; read the linked implementation. Direct named calls: `useI18n`, `listing.images.find`, `tEnum`, `getFuelType`, `formatPrice`, `t`, `formatMileage`, `getMileageKm`, `getTransmission`. |

---

**[apps/frontend/src/features/listings/components/ListingGallery.tsx](../apps/frontend/src/features/listings/components/ListingGallery.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `ListingGallery`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `ListingGallery` (line 19) | { images, title } | No leading explanation comment; read the linked implementation. Direct named calls: `useI18n`, `useState`, `useRef`, `t`, `Math.min`, `images.map`. |
| `ListingGallery.show` (line 35) | next | No leading explanation comment; read the linked implementation. Direct named calls: `setSelectedIndex`. |
| `ListingGallery.onTouchStart` (line 37) | event | No leading explanation comment; read the linked implementation. |
| `ListingGallery.onTouchEnd` (line 38) | event | No leading explanation comment; read the linked implementation. Direct named calls: `Math.abs`, `show`. |
| `ListingGallery.onKeyDown` (line 47) | event | No leading explanation comment; read the linked implementation. Direct named calls: `event.preventDefault`, `show`. |

---

**[apps/frontend/src/features/listings/components/ListingPhoto.tsx](../apps/frontend/src/features/listings/components/ListingPhoto.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `ListingPhoto`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `ListingPhoto` (line 16) | { image, alt, sizes, priority = false, ...imgProps } | A listing photo that lets the browser choose the right size: the 800 px copy on phones and in cards, the full photo only where it is drawn large on a wide or high-density screen. |

---

**[apps/frontend/src/features/listings/components/ListingStatusBadge.tsx](../apps/frontend/src/features/listings/components/ListingStatusBadge.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `ListingStatusBadge`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `ListingStatusBadge` (line 8) | { status } | No leading explanation comment; read the linked implementation. |

---

**[apps/frontend/src/features/listings/components/ReducePriceDialog.tsx](../apps/frontend/src/features/listings/components/ReducePriceDialog.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `ReducePriceDialog`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `ReducePriceDialog` (line 15) | { listings, onConfirm, onClose } | Asks how much to cut the price of one or many listings, and previews the new prices first. Direct named calls: `useState`, `useRef`, `Number.isInteger`, `useEffect`, `listings.slice`, `PRESETS.map`, `preview.map`. |
| `ReducePriceDialog.onKeyDown` (line 27) | event | No leading explanation comment; read the linked implementation. Direct named calls: `onCloseRef.current`. |
| `ReducePriceDialog.confirm` (line 32) | None | No leading explanation comment; read the linked implementation. Direct named calls: `setIsSaving`, `setError`, `onConfirm`, `onClose`. |

---

**[apps/frontend/src/features/listings/schemas/listing.schema.ts](../apps/frontend/src/features/listings/schemas/listing.schema.ts)**

Validation rules and related types; these reject or normalize unsupported input.

Exported declarations: `createListingSchema`, `CreateListingInput`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/features/listings/services/listingApi.ts](../apps/frontend/src/features/listings/services/listingApi.ts)**

Frontend API adapter: translates UI requests into HTTP calls and extracts response data.

Exported declarations: `listingApi`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `toListing` (line 15) | dto | No leading explanation comment; read the linked implementation. Direct named calls: `dto.images.map`. |
| `toPaginatedResponse` (line 43) | response | No leading explanation comment; read the linked implementation. Direct named calls: `response.data.map`. |
| `getMyListingStats` (line 57) | None | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`. |
| `bulkAction` (line 62) | input | One action on many listings: chosen IDs, or every listing from one CSV upload. Direct named calls: `apiClient.post`. |
| `getMyListing` (line 66) | id | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`, `toListing`. |
| `getMyListings` (line 70) | page, limit, filters | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`, `toPaginatedResponse`. |
| `createListing` (line 77) | input | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.post`, `toListing`. |
| `updateListing` (line 82) | id, input | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.patch`, `toListing`. |
| `updateListingStatus` (line 87) | id, input | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.patch`, `toListing`. |
| `uploadImage` (line 92) | id, file, alt | No leading explanation comment; read the linked implementation. Direct named calls: `formData.append`, `apiClient.post`, `toListing`. |
| `deleteImage` (line 100) | id, imageKey | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.delete`, `encodeURIComponent`, `toListing`. |
| `reorderImages` (line 105) | id, imageKeys | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.patch`, `toListing`. |
| `deleteListing` (line 110) | id | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.delete`. |

---

**[apps/frontend/src/features/listings/types/listing.types.ts](../apps/frontend/src/features/listings/types/listing.types.ts)**

Type contracts; these describe values for TypeScript and are not database writes or runtime checks by themselves.

Exported declarations: `ListingStatus`, `VehicleImage`, `ListingDealer`, `Listing`, `ListingFilters`, `PaginatedResponse`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/features/listings/utils/vehicleAttributes.ts](../apps/frontend/src/features/listings/utils/vehicleAttributes.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `getMileageKm`, `getFuelType`, `getTransmission`, `getCondition`, `getEdition`, `getEngineCapacityCc`, `getBatteryCapacityKWh`, `getBatteryRangeKm`, `getBodyType`, `formatEnumLabel`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `getMileageKm` (line 8) | listing | No leading explanation comment; read the linked implementation. |
| `getFuelType` (line 12) | listing | No leading explanation comment; read the linked implementation. |
| `getTransmission` (line 16) | listing | No leading explanation comment; read the linked implementation. |
| `getCondition` (line 20) | listing | No leading explanation comment; read the linked implementation. |
| `getEdition` (line 24) | listing | No leading explanation comment; read the linked implementation. |
| `getEngineCapacityCc` (line 28) | listing | No leading explanation comment; read the linked implementation. |
| `getBatteryCapacityKWh` (line 32) | listing | No leading explanation comment; read the linked implementation. |
| `getBatteryRangeKm` (line 36) | listing | No leading explanation comment; read the linked implementation. |
| `getBodyType` (line 40) | listing | No leading explanation comment; read the linked implementation. |
| `formatEnumLabel` (line 45) | value | Human-readable label for a snake_case enum value, e.g. "plug_in_hybrid" -> "Plug in hybrid". Direct named calls: `value.replace`, `spaced.charAt`, `spaced.slice`. |

---

**[apps/frontend/src/features/notifications/components/NotificationCenter.test.tsx](../apps/frontend/src/features/notifications/components/NotificationCenter.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `minutesAgo` (line 11) | m | No leading explanation comment; read the linked implementation. Direct named calls: `Date.now`. |
| `note` (line 12) | id, overrides | No leading explanation comment; read the linked implementation. Direct named calls: `minutesAgo`. |
| `renderCentre` (line 16) | None | No leading explanation comment; read the linked implementation. Direct named calls: `render`. |

Declared test groups and cases:

- describe: notification centre (line 20)
- it: shows the unread count and the list, with details, times and e-mail status (line 23)
- it: marks one notification read, then all of them (line 45)
- it: opens the stale listings from a stale-stock reminder (line 64)
- it: says when there is nothing new, caps a large count, and stays quiet if loading fails (line 73)
- it: does not break the page when the notification service is down (line 84)

---

**[apps/frontend/src/features/notifications/components/NotificationCenter.tsx](../apps/frontend/src/features/notifications/components/NotificationCenter.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `NotificationCenter`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `timeAgo` (line 22) | value | No leading explanation comment; read the linked implementation. Direct named calls: `Math.max`, `Math.floor`, `Date.now`. |
| `NotificationCenter` (line 32) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useState`, `useNavigate`, `useEffect`, `notifications.map`. |
| `NotificationCenter.refresh` (line 39) | None | No leading explanation comment; read the linked implementation. Direct named calls: `Promise.all`, `notificationApi.unreadCount`, `notificationApi.list`, `setUnreadCount`, `setNotifications`. |
| `NotificationCenter.markRead` (line 55) | notification | No leading explanation comment; read the linked implementation. Direct named calls: `setOpen`, `navigate`, `setNotifications`, `setUnreadCount`, `notificationApi.markRead`. |
| `NotificationCenter.markAllRead` (line 64) | None | No leading explanation comment; read the linked implementation. Direct named calls: `setLoading`, `notificationApi.markAllRead`, `setNotifications`, `setUnreadCount`. |

---

**[apps/frontend/src/features/notifications/services/notificationApi.ts](../apps/frontend/src/features/notifications/services/notificationApi.ts)**

Frontend API adapter: translates UI requests into HTTP calls and extracts response data.

Exported declarations: `notificationApi`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `list` (line 5) | page, limit | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`. |
| `unreadCount` (line 9) | None | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.get`. |
| `markRead` (line 13) | id | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.patch`. |
| `markAllRead` (line 16) | None | No leading explanation comment; read the linked implementation. Direct named calls: `apiClient.patch`. |

---

**[apps/frontend/src/features/recommendations/VehicleSuggestions.tsx](../apps/frontend/src/features/recommendations/VehicleSuggestions.tsx)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `RecommendedVehicles`, `SimilarVehicles`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `SuggestionRow` (line 11) | { id, title, subtitle, listings, action } | A titled row of vehicle cards. On phones the row scrolls sideways instead of stacking, so it never pushes the main results far down the page. Direct named calls: `listings.map`. |
| `RecommendedVehicles` (line 28) | { limit = 8 } | "Recommended for you": shown only once this browser has viewed some vehicles, and only when the server found matches. Failures hide the section; it is a bonus, never a blocker. Direct named calls: `useI18n`, `useState`, `useQuery`, `t`. |
| `RecommendedVehicles.queryFn` (line 31) | None | No leading explanation comment; read the linked implementation. Direct named calls: `buyerApi.getRecommendedVehicles`. |
| `RecommendedVehicles.clear` (line 33) | None | No leading explanation comment; read the linked implementation. Direct named calls: `clearRecentlyViewed`, `setViewed`. |
| `SimilarVehicles` (line 39) | { listingId, limit = 6 } | "Similar vehicles" under a listing. Direct named calls: `useI18n`, `useQuery`, `t`. |
| `SimilarVehicles.queryFn` (line 41) | None | No leading explanation comment; read the linked implementation. Direct named calls: `buyerApi.getSimilarVehicles`. |

---

**[apps/frontend/src/features/recommendations/recentlyViewed.ts](../apps/frontend/src/features/recommendations/recentlyViewed.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `MAX_RECENTLY_VIEWED`, `getRecentlyViewed`, `recordRecentlyViewed`, `clearRecentlyViewed`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `getRecentlyViewed` (line 8) | None | No leading explanation comment; read the linked implementation. Direct named calls: `readStored`. |
| `recordRecentlyViewed` (line 12) | listingId | No leading explanation comment; read the linked implementation. Direct named calls: `writeStored`, `getRecentlyViewed`. |
| `clearRecentlyViewed` (line 16) | None | No leading explanation comment; read the linked implementation. Direct named calls: `removeStored`. |

---

**[apps/frontend/src/main.tsx](../apps/frontend/src/main.tsx)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/portals/admin/admin.routes.tsx](../apps/frontend/src/portals/admin/admin.routes.tsx)**

Route definitions: inspect the listed registrations and guards. Express routes are mounted by backend app.ts; frontend route arrays are metadata, while app/App.tsx mounts the actual React routes.

Exported declarations: `adminRoutes`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/portals/admin/layout/AdminLayout.tsx](../apps/frontend/src/portals/admin/layout/AdminLayout.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `AdminLayout`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `icon` (line 5) | path | No leading explanation comment; read the linked implementation. |
| `AdminLayout` (line 33) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useAuth`. |

---

**[apps/frontend/src/portals/admin/pages/AccountDetails.tsx](../apps/frontend/src/portals/admin/pages/AccountDetails.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `AccountDetails`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `AccountDetails` (line 5) | { userId, onClose } | No leading explanation comment; read the linked implementation. Direct named calls: `useState`, `useEffect`, `formatDate`, `user.dealer.brands.join`, `Object.entries`. |

---

**[apps/frontend/src/portals/admin/pages/AdminDashboard.tsx](../apps/frontend/src/portals/admin/pages/AdminDashboard.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `AdminDashboard`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `AdminDashboard` (line 9) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useState`, `uploads.filter`, `applications.map`, `attentionUploads.map`, `attentionItems.slice`, `uploads.slice`, `activity.slice`, `useEffect`, `unavailable.has`, `visibleAttention.map`, `visibleUploads.map`, `visibleActivity.map`. |
| `AdminDashboard.toggleExpanded` (line 28) | section | No leading explanation comment; read the linked implementation. Direct named calls: `setExpanded`. |
| `formatWaitingTime` (line 64) | createdAt | No leading explanation comment; read the linked implementation. Direct named calls: `Math.floor`, `Date.now`, `Math.max`. |
| `formatUploadStatus` (line 65) | status | No leading explanation comment; read the linked implementation. |
| `formatAuditEvent` (line 66) | event, target | No leading explanation comment; read the linked implementation. |
| `SectionHeader` (line 67) | { title, count, expanded, onToggle } | No leading explanation comment; read the linked implementation. |
| `EmptyMessage` (line 68) | { text } | No leading explanation comment; read the linked implementation. |
| `UnavailableMessage` (line 69) | { text } | No leading explanation comment; read the linked implementation. |

---

**[apps/frontend/src/portals/admin/pages/AuditLogs.tsx](../apps/frontend/src/portals/admin/pages/AuditLogs.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `AuditLogs`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `AuditLogs` (line 15) | None | Filters (event type, date range, page) live in the URL so a filtered view can be shared or reloaded. Direct named calls: `useSearchParams`, `params.get`, `Number`, `useState`, `useEffect`, `Boolean`, `Object.keys`, `logs.map`. |
| `AuditLogs.update` (line 27) | changes | No leading explanation comment; read the linked implementation. Direct named calls: `Object.entries`, `next.set`, `next.delete`, `setParams`. |

---

**[apps/frontend/src/portals/admin/pages/DealerApprovals.tsx](../apps/frontend/src/portals/admin/pages/DealerApprovals.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `DealerApprovals`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `DealerApprovals` (line 7) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useState`, `useSearchParams`, `params.get`, `useEffect`, `dealers.map`. |
| `DealerApprovals.setStatus` (line 20) | value | No leading explanation comment; read the linked implementation. Direct named calls: `setParams`. |
| `DealerApprovals.loadApplications` (line 22) | None | No leading explanation comment; read the linked implementation. Direct named calls: `setError`, `setDealers`, `getPendingDealerApplications`, `setIsLoading`. |
| `DealerApprovals.decide` (line 33) | dealerId, decision | No leading explanation comment; read the linked implementation. Direct named calls: `rejectionReason.trim`, `setError`, `setProcessingId`, `approveDealerApplication`, `rejectDealerApplication`, `setRejectingId`, `setRejectionReason`, `loadApplications`. |

---

**[apps/frontend/src/portals/admin/pages/ListingMonitoring.tsx](../apps/frontend/src/portals/admin/pages/ListingMonitoring.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `ListingMonitoring`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `ListingMonitoring` (line 12) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useState`, `useCallback`, `useEffect`, `filterableCategories.map`, `listings.map`. |
| `ListingMonitoring.removeListing` (line 36) | listing | No leading explanation comment; read the linked implementation. Direct named calls: `window.confirm`, `setRemovingId`, `setError`, `adminApi.removeListing`, `setListings`. |

---

**[apps/frontend/src/portals/admin/pages/SystemHealth.tsx](../apps/frontend/src/portals/admin/pages/SystemHealth.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `SystemHealth`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `SystemHealth` (line 5) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useState`, `useEffect`, `services.map`, `formatDateTime`. |

---

**[apps/frontend/src/portals/admin/pages/UploadCollection.tsx](../apps/frontend/src/portals/admin/pages/UploadCollection.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `UploadCollection`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `UploadCollection` (line 8) | { job } | No leading explanation comment; read the linked implementation. Direct named calls: `useState`, `useEffect`, `records.map`. |

---

**[apps/frontend/src/portals/admin/pages/UploadMonitoring.tsx](../apps/frontend/src/portals/admin/pages/UploadMonitoring.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `UploadMonitoring`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `statusBadge` (line 11) | status | No leading explanation comment; read the linked implementation. |
| `UploadMonitoring` (line 15) | None | Filters live in the URL, so dashboard links (?uploadId=…) open the exact record and a filtered view can be shared or reloaded. Direct named calls: `useSearchParams`, `params.get`, `Number`, `useState`, `useEffect`, `dealers.map`, `uploads.map`. |
| `UploadMonitoring.update` (line 31) | changes | No leading explanation comment; read the linked implementation. Direct named calls: `Object.entries`, `next.set`, `next.delete`, `setParams`. |

---

**[apps/frontend/src/portals/admin/pages/UserManagement.tsx](../apps/frontend/src/portals/admin/pages/UserManagement.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `UserManagement`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `UserManagement` (line 9) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useState`, `useCallback`, `useEffect`, `users.map`. |
| `UserManagement.toggleStatus` (line 33) | user | Replace only the changed row so current filters remain intact. Direct named calls: `setUpdatingId`, `setError`, `adminApi.setUserStatus`, `setUsers`. |

---

**[apps/frontend/src/portals/admin/pages/adminDetails.test.tsx](../apps/frontend/src/portals/admin/pages/adminDetails.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- it: opens a bulk collection, shows current listing status, and switches to rejected rows (line 12)
- it: opens the listing owner account with dealership contact details (line 22)
- it: reports collection load failures (line 31)

---

**[apps/frontend/src/portals/admin/pages/adminManagement.test.tsx](../apps/frontend/src/portals/admin/pages/adminManagement.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `renderAt` (line 16) | path, route, element | No leading explanation comment; read the linked implementation. Direct named calls: `render`. |
| `user` (line 18) | id, overrides | No leading explanation comment; read the linked implementation. |
| `listing` (line 19) | id, overrides | No leading explanation comment; read the linked implementation. |

Declared test groups and cases:

- describe: User management (line 24)
- it: lists users, filters by role and search, and suspends one without reloading the rest (line 27)
- it: shows an empty result and load or update errors (line 48)
- it: reports a failed status change (line 59)
- describe: Listing monitoring (line 68)
- it: filters listings and archives one after confirmation (line 71)
- it: drops an archived listing from an "active" view and keeps it when the dealer cancels (line 93)
- it: shows load and archive errors (line 109)
- describe: Audit logs (line 123)
- it: reads filters from the address, shows events and pages through them (line 126)
- it: distinguishes "nothing recorded" from "nothing matches" and from an outage (line 144)
- describe: System health (line 159)
- it: shows each service status, or the error when the check fails (line 162)

---

**[apps/frontend/src/portals/admin/pages/adminPages.test.tsx](../apps/frontend/src/portals/admin/pages/adminPages.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `application` (line 15) | id, overrides | No leading explanation comment; read the linked implementation. |
| `renderAt` (line 20) | path, route, element | No leading explanation comment; read the linked implementation. Direct named calls: `render`. |

Declared test groups and cases:

- describe: Dealer Approvals (line 22)
- it: opens the tab from the link (?status=approved) instead of always showing pending (line 25)
- it: highlights and scrolls to the exact application from a dashboard link, and shows earlier rejections (line 31)
- describe: Admin dashboard (line 43)
- it: says a section is unavailable instead of showing zero or "none yet" when it fails to load (line 46)
- it: links a waiting application to that exact application (line 59)
- describe: Upload monitoring (line 70)
- it: loads only the linked upload when opened with ?uploadId (line 73)
- it: passes the date range and page to the server (line 82)

---

**[apps/frontend/src/portals/buyer/buyer.routes.tsx](../apps/frontend/src/portals/buyer/buyer.routes.tsx)**

Route definitions: inspect the listed registrations and guards. Express routes are mounted by backend app.ts; frontend route arrays are metadata, while app/App.tsx mounts the actual React routes.

Exported declarations: `buyerRoutes`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/portals/buyer/layout/BuyerLayout.tsx](../apps/frontend/src/portals/buyer/layout/BuyerLayout.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `BuyerLayout`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `BuyerLayout` (line 9) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useAuth`, `useCompare`, `useI18n`, `useLocation`, `useState`, `useRef`, `useEffect`, `t`. |
| `BuyerLayout.onKeyDown` (line 21) | event | No leading explanation comment; read the linked implementation. Direct named calls: `setMenuOpen`, `menuButtonRef.current?.focus`. |

---

**[apps/frontend/src/portals/buyer/pages/ComparePage.tsx](../apps/frontend/src/portals/buyer/pages/ComparePage.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `bestIndexes`, `ComparePage`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `number` (line 14) | value | No leading explanation comment; read the linked implementation. |
| `bestIndexes` (line 25) | values, better | Indexes of the vehicles holding the best value in a row (ties all count); none when all are equal. Direct named calls: `values.filter`, `Math.min`, `Math.max`, `known.every`, `values.flatMap`. |
| `ComparePage` (line 33) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useI18n`, `useSearchParams`, `useCompare`, `searchParams.get`, `useQueries`, `ids.map`, `useEffect`, `t`, `results.map`, `loaded.filter`, `rows.map`. |
| `ComparePage.removeVehicle` (line 42) | id | Removes the vehicle from the picked list and, when the page came from a link, from the link too. Direct named calls: `remove`, `ids.filter`, `setSearchParams`, `rest.join`. |
| `ComparePage.queryFn` (line 49) | None | No leading explanation comment; read the linked implementation. Direct named calls: `buyerApi.getVehicle`. |
| `ComparePage.value` (line 54) | l | No leading explanation comment; read the linked implementation. Direct named calls: `formatPrice`. |
| `ComparePage.score` (line 54) | l | No leading explanation comment; read the linked implementation. |
| `ComparePage.value` (line 55) | l | No leading explanation comment; read the linked implementation. Direct named calls: `String`. |
| `ComparePage.score` (line 55) | l | No leading explanation comment; read the linked implementation. |
| `ComparePage.value` (line 56) | l | No leading explanation comment; read the linked implementation. Direct named calls: `getMileageKm`, `number`. |
| `ComparePage.value` (line 57) | l | No leading explanation comment; read the linked implementation. Direct named calls: `tEnum`. |
| `ComparePage.value` (line 58) | l | No leading explanation comment; read the linked implementation. Direct named calls: `getBodyType`, `tEnum`. |
| `ComparePage.value` (line 59) | l | No leading explanation comment; read the linked implementation. Direct named calls: `getCondition`, `tEnum`. |
| `ComparePage.value` (line 60) | l | No leading explanation comment; read the linked implementation. Direct named calls: `getFuelType`, `tEnum`. |
| `ComparePage.value` (line 61) | l | No leading explanation comment; read the linked implementation. Direct named calls: `getTransmission`, `tEnum`. |
| `ComparePage.value` (line 62) | l | No leading explanation comment; read the linked implementation. Direct named calls: `getEngineCapacityCc`, `number`. |
| `ComparePage.value` (line 63) | l | No leading explanation comment; read the linked implementation. |
| `ComparePage.value` (line 64) | l | No leading explanation comment; read the linked implementation. |

---

**[apps/frontend/src/portals/buyer/pages/Marketplace.test.tsx](../apps/frontend/src/portals/buyer/pages/Marketplace.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `car` (line 13) | n, overrides | No leading explanation comment; read the linked implementation. |
| `results` (line 18) | cars, total, totalPages | No leading explanation comment; read the linked implementation. |
| `renderMarketplace` (line 20) | path | No leading explanation comment; read the linked implementation. Direct named calls: `render`. |

Declared test groups and cases:

- describe: buyer marketplace (line 25)
- it: lists vehicles and filters them, counting the active filters (line 28)
- it: searches in everyday language after the buyer stops typing, sorted by relevance (line 45)
- it: starts from a search in the address, e.g. from the home page (line 58)
- it: pages through long result lists (line 66)
- it: shows an empty result with a way out, and an error with a retry (line 80)
- it: opens the filter sheet on small screens and closes it with Escape, returning focus (line 93)

---

**[apps/frontend/src/portals/buyer/pages/Marketplace.tsx](../apps/frontend/src/portals/buyer/pages/Marketplace.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `Marketplace`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `countActiveFilters` (line 12) | filters | Filters that narrow the results (search text and sort order are shown elsewhere). Direct named calls: `Object.entries`. |
| `toNumber` (line 15) | value | No leading explanation comment; read the linked implementation. Direct named calls: `Number`. |
| `Marketplace` (line 17) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useI18n`, `useSearchParams`, `searchParams.get`, `useBuyerListings`, `useState`, `useRef`, `countActiveFilters`, `useEffect`, `t`, `buyerVehicleCategories.map`, `buyerVehicleMakes.map`, `buyerFuelTypes.map`, `transmissionTypes.map`, `vehicleConditions.map`, `carBodyTypes.map`, `data.data.map`, `Array.from`. |
| `Marketplace.onKeyDown` (line 43) | event | No leading explanation comment; read the linked implementation. Direct named calls: `closeFilters`. |
| `Marketplace.closeFilters` (line 48) | None | No leading explanation comment; read the linked implementation. Direct named calls: `setFiltersOpen`, `filtersButtonRef.current?.focus`. |
| `Marketplace.clearAll` (line 49) | None | No leading explanation comment; read the linked implementation. Direct named calls: `setSearchInput`, `setSearchParams`, `resetFilters`. |

---

**[apps/frontend/src/portals/buyer/pages/VehicleDetails.test.tsx](../apps/frontend/src/portals/buyer/pages/VehicleDetails.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `renderPage` (line 21) | None | No leading explanation comment; read the linked implementation. Direct named calls: `render`. |

Declared test groups and cases:

- describe: vehicle page (line 26)
- it: keeps Call, WhatsApp and Email one tap away, with the WhatsApp message ready (line 33)
- it: loads the small photo copy on phones, and lets the buyer swipe or tap through photos (line 41)
- it: ignores a mostly vertical finger movement (the page scrolling) (line 57)
- it: remembers the vehicle on this device for recommendations, and shows similar vehicles (line 65)

---

**[apps/frontend/src/portals/buyer/pages/VehicleDetails.tsx](../apps/frontend/src/portals/buyer/pages/VehicleDetails.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `VehicleDetails`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `toAbsoluteUrl` (line 17) | url | Dealers can enter a website without a scheme (e.g. "www.abcmotors.lk"); without one, the browser would treat the href as a relative path instead of an external link. |
| `PhoneIcon` (line 21) | None | No leading explanation comment; read the linked implementation. |
| `MailIcon` (line 27) | None | No leading explanation comment; read the linked implementation. |
| `WebsiteIcon` (line 34) | None | No leading explanation comment; read the linked implementation. |
| `WhatsAppIcon` (line 41) | None | No leading explanation comment; read the linked implementation. |
| `VehicleDetails` (line 47) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useParams`, `useBuyerListing`, `useI18n`, `Boolean`, `useBodyClass`, `useEffect`, `t`, `getEngineCapacityCc`, `getBatteryCapacityKWh`, `getBatteryRangeKm`, `getMileageKm`, `getEdition`, `getBodyType`, `tEnum`, `String`, `getCondition`, `getTransmission`, `getFuelType`, `number`, `whatsAppLink`, `specs.filter`, `formatPrice`, `toAbsoluteUrl`, `dealer.website.replace`, `formatDate`. |
| `VehicleDetails.number` (line 71) | value | No leading explanation comment; read the linked implementation. |

---

**[apps/frontend/src/portals/dealer/dealer.routes.tsx](../apps/frontend/src/portals/dealer/dealer.routes.tsx)**

Route definitions: inspect the listed registrations and guards. Express routes are mounted by backend app.ts; frontend route arrays are metadata, while app/App.tsx mounts the actual React routes.

Exported declarations: `dealerRoutes`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/portals/dealer/layout/DealerLayout.tsx](../apps/frontend/src/portals/dealer/layout/DealerLayout.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `DealerLayout`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `icon` (line 5) | path | No leading explanation comment; read the linked implementation. |
| `DealerLayout` (line 35) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useAuth`. |

---

**[apps/frontend/src/portals/dealer/pages/DealerDashboard.tsx](../apps/frontend/src/portals/dealer/pages/DealerDashboard.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `DealerDashboard`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `uploadStatusBadge` (line 11) | status | No leading explanation comment; read the linked implementation. |
| `DealerDashboard` (line 13) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useQuery`, `listings.slice`, `uploads.map`. |
| `DealerDashboard.queryFn` (line 14) | None | No leading explanation comment; read the linked implementation. Direct named calls: `listingApi.getMyListingStats`. |
| `DealerDashboard.queryFn` (line 15) | None | No leading explanation comment; read the linked implementation. Direct named calls: `listingApi.getMyListings`. |
| `DealerDashboard.queryFn` (line 16) | None | No leading explanation comment; read the linked implementation. Direct named calls: `inventoryApi.listUploads`. |

---

**[apps/frontend/src/portals/dealer/pages/DealerProfile.test.tsx](../apps/frontend/src/portals/dealer/pages/DealerProfile.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: DealerProfile (line 16)
- it: shows the verified business name and registration number as read-only (line 19)
- it: saves edited details and confirms (line 26)
- it: shows the server message when saving fails (line 39)

---

**[apps/frontend/src/portals/dealer/pages/DealerProfile.tsx](../apps/frontend/src/portals/dealer/pages/DealerProfile.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `DealerProfile`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `toForm` (line 11) | dealer | No leading explanation comment; read the linked implementation. Direct named calls: `dealer.brands.join`, `String`. |
| `DealerProfile` (line 19) | None | Lets an approved dealer keep the business details buyers see up to date (FR-DEALER-03). The business name and registration number were verified during review, so they are read-only. Direct named calls: `useState`, `useEffect`, `field`, `set`. |
| `DealerProfile.set` (line 33) | field | No leading explanation comment; read the linked implementation. |
| `DealerProfile.save` (line 35) | event | No leading explanation comment; read the linked implementation. Direct named calls: `event.preventDefault`, `setSaving`, `setStatus`, `updateMyDealerProfile`, `form.website.trim`, `form.brands.split`, `form.inventoryCount.trim`, `Number`, `setDealer`, `setForm`, `toForm`. |
| `DealerProfile.field` (line 52) | label, name, props | No leading explanation comment; read the linked implementation. Direct named calls: `set`. |

---

**[apps/frontend/src/portals/dealer/pages/InventoryUpload.tsx](../apps/frontend/src/portals/dealer/pages/InventoryUpload.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `InventoryUpload`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `statusBadgeClass` (line 9) | status | No leading explanation comment; read the linked implementation. |
| `InventoryUpload` (line 14) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useNavigate`, `useState`, `useQuery`, `uploadableCategories.map`, `formatFileSize`, `template?.fields.map`, `uploads.map`. |
| `InventoryUpload.queryFn` (line 17) | None | No leading explanation comment; read the linked implementation. Direct named calls: `inventoryApi.listUploads`. |
| `InventoryUpload.handleFileChange` (line 27) | e | No leading explanation comment; read the linked implementation. Direct named calls: `setSelectedFile`, `setError`. |
| `InventoryUpload.handleStartUpload` (line 34) | None | No leading explanation comment; read the linked implementation. Direct named calls: `setError`, `setIsUploading`, `setUploadProgress`, `inventoryApi.uploadCsv`, `navigate`. |
| `InventoryUpload.handleDownloadTemplate` (line 48) | None | No leading explanation comment; read the linked implementation. Direct named calls: `setIsDownloading`, `inventoryApi.downloadTemplate`, `URL.createObjectURL`, `document.createElement`, `document.body.appendChild`, `link.click`, `link.remove`, `URL.revokeObjectURL`, `setError`. |

---

**[apps/frontend/src/portals/dealer/pages/ListingForm.test.tsx](../apps/frontend/src/portals/dealer/pages/ListingForm.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `ImageCropModal` (line 12) | { file, onConfirm, onCancel } | No leading explanation comment; read the linked implementation. |
| `saved` (line 22) | overrides | No leading explanation comment; read the linked implementation. |
| `renderForm` (line 29) | path | No leading explanation comment; read the linked implementation. Direct named calls: `render`. |
| `field` (line 40) | label | No leading explanation comment; read the linked implementation. Direct named calls: `screen.getByLabelText`. |
| `fillRequired` (line 41) | None | No leading explanation comment; read the linked implementation. Direct named calls: `userEvent.type`, `field`, `userEvent.selectOptions`, `userEvent.clear`. |

Declared test groups and cases:

- describe: dealer listing form (line 52)
- it: creates a car listing with only the fields that apply, then returns to the listings (line 55)
- it: asks for battery details for electric vehicles and the extra field of each vehicle type (line 73)
- it: sends the extras of each vehicle type (line 95)
- it: crops each chosen photo, uploads it after saving, and offers a retry when an upload fails (line 107)
- it: keeps no photos when every crop is skipped (line 134)
- it: edits an existing listing: loads it, reorders and removes photos, and saves (line 141)
- it: reports load and photo-order errors (line 164)
- it: reports a failed reorder and a failed save (line 170)

---

**[apps/frontend/src/portals/dealer/pages/ListingForm.tsx](../apps/frontend/src/portals/dealer/pages/ListingForm.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `ListingForm`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `ListingForm` (line 26) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useNavigate`, `useParams`, `useState`, `Boolean`, `engineRequiredFuels.has`, `batteryRequiredFuels.has`, `useEffect`, `existingImages.map`, `listableCategories.map`, `availableMakes.map`, `carBodyTypes.map`, `motorcycleTypes.map`, `vehicleConditions.map`, `listableFuelTypes.map`, `listableTransmissions.map`. |
| `ListingForm.buildAttributes` (line 65) | None | No leading explanation comment; read the linked implementation. Direct named calls: `Number`. |
| `ListingForm.handleFilesSelected` (line 83) | files | No leading explanation comment; read the linked implementation. Direct named calls: `setCropQueue`, `setCroppedSoFar`. |
| `ListingForm.handleCropConfirm` (line 89) | croppedFile | No leading explanation comment; read the linked implementation. Direct named calls: `cropQueue.slice`, `setImages`, `setCropQueue`, `setCroppedSoFar`. |
| `ListingForm.handleCropSkip` (line 102) | None | No leading explanation comment; read the linked implementation. Direct named calls: `cropQueue.slice`, `setImages`, `setCropQueue`, `setCroppedSoFar`. |
| `ListingForm.moveExistingImage` (line 113) | index, direction | No leading explanation comment; read the linked implementation. Direct named calls: `setError`, `setImageMessage`, `listingApi.reorderImages`, `nextImages.map`, `setExistingImages`. |
| `ListingForm.handleSubmit` (line 129) | event | No leading explanation comment; read the linked implementation. Direct named calls: `event.preventDefault`, `setError`, `setSuccessMessage`, `setIsSubmitting`, `buildAttributes`, `listingApi.updateListing`, `listingApi.createListing`, `setSavedListingId`, `listingApi.uploadImage`, `setImages`, `window.setTimeout`. |

---

**[apps/frontend/src/portals/dealer/pages/ListingManager.test.tsx](../apps/frontend/src/portals/dealer/pages/ListingManager.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `listing` (line 13) | n, overrides | No leading explanation comment; read the linked implementation. |
| `page` (line 18) | data | No leading explanation comment; read the linked implementation. |
| `renderAt` (line 20) | path | No leading explanation comment; read the linked implementation. Direct named calls: `render`. |

Declared test groups and cases:

- describe: dealer listing manager (line 25)
- it: reminds the dealer about stale stock and opens the stale list (line 32)
- it: publishes every selected draft in one request (line 43)
- it: offers one-click fixes on stale listings and shows how long ago each was confirmed (line 56)
- it: previews a price cut before applying it (line 69)
- it: explains skipped listings in plain words (line 84)

---

**[apps/frontend/src/portals/dealer/pages/ListingManager.tsx](../apps/frontend/src/portals/dealer/pages/ListingManager.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `describeBulkResult`, `ListingManager`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `describeBulkResult` (line 28) | result | "Published 5 listings. 2 were skipped because the action does not apply to their status." |
| `daysSince` (line 33) | value | No leading explanation comment; read the linked implementation. Direct named calls: `Math.floor`, `Date.now`. |
| `ListingManager` (line 37) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useSearchParams`, `views.includes`, `searchParams.get`, `Math.max`, `Number`, `useState`, `useQueryClient`, `useEffect`, `useQuery`, `listings.every`, `tab`, `vehicleCategories.map`, `listings.map`. |
| `ListingManager.setParams` (line 51) | changes | Updates the URL (so views, filters and pages survive reloads and can be linked to), resetting the page. Direct named calls: `Object.entries`, `next.set`, `next.delete`, `setSearchParams`. |
| `ListingManager.queryFn` (line 66) | None | No leading explanation comment; read the linked implementation. Direct named calls: `listingApi.getMyListingStats`. |
| `ListingManager.queryFn` (line 73) | None | No leading explanation comment; read the linked implementation. Direct named calls: `listingApi.getMyListings`. |
| `ListingManager.refresh` (line 79) | None | No leading explanation comment; read the linked implementation. Direct named calls: `Promise.all`, `queryClient.invalidateQueries`. |
| `ListingManager.run` (line 85) | action, ids, percent | No leading explanation comment; read the linked implementation. Direct named calls: `setBusy`, `setMessage`, `listingApi.bulkAction`, `describeBulkResult`, `setSelected`, `refresh`. |
| `ListingManager.runSafely` (line 99) | action, ids | No leading explanation comment; read the linked implementation. Direct named calls: `run`. |
| `ListingManager.deleteForever` (line 100) | ids | No leading explanation comment; read the linked implementation. Direct named calls: `window.confirm`, `runSafely`. |
| `ListingManager.toggleAll` (line 107) | None | No leading explanation comment; read the linked implementation. Direct named calls: `setSelected`, `listings.map`. |
| `ListingManager.toggleOne` (line 108) | id | No leading explanation comment; read the linked implementation. Direct named calls: `setSelected`. |
| `ListingManager.tab` (line 110) | value, label, count | No leading explanation comment; read the linked implementation. |

---

**[apps/frontend/src/portals/dealer/pages/UploadDetails.test.tsx](../apps/frontend/src/portals/dealer/pages/UploadDetails.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `job` (line 15) | overrides | No leading explanation comment; read the linked implementation. |
| `renderPage` (line 23) | None | No leading explanation comment; read the linked implementation. Direct named calls: `render`. |

Declared test groups and cases:

- describe: UploadDetails (line 34)
- it: publishes all of this upload's drafts in one step (line 41)
- it: shows the failure reason and lets the dealer retry a failed CSV import (line 55)
- it: lets the dealer retry failed photo processing (line 68)
- it: shows an error message when the retry is refused (line 80)
- it: does not offer Retry for an upload that succeeded (line 90)

---

**[apps/frontend/src/portals/dealer/pages/UploadDetails.tsx](../apps/frontend/src/portals/dealer/pages/UploadDetails.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `UploadDetails`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `PublishDraftsCard` (line 14) | { uploadId } | CSV rows are imported as drafts so the dealer can check them first. This publishes every draft from this upload in one step, instead of opening each listing. Direct named calls: `useQueryClient`, `useQuery`, `useState`. |
| `PublishDraftsCard.queryFn` (line 16) | None | No leading explanation comment; read the linked implementation. Direct named calls: `listingApi.getMyListings`. |
| `PublishDraftsCard.publishAll` (line 21) | None | No leading explanation comment; read the linked implementation. Direct named calls: `window.confirm`, `setIsPublishing`, `setMessage`, `listingApi.bulkAction`, `Promise.all`, `queryClient.invalidateQueries`. |
| `RetryButton` (line 51) | { uploadId, stage } | Re-queues a failed stage and refreshes the job so its new pending status shows immediately. Direct named calls: `useQueryClient`, `useState`. |
| `RetryButton.retry` (line 55) | None | No leading explanation comment; read the linked implementation. Direct named calls: `setError`, `setIsRetrying`, `inventoryApi.retryUpload`, `inventoryApi.retryImages`, `queryClient.invalidateQueries`. |
| `VehiclePhotosCard` (line 72) | { uploadId, canUpload, imageProcessingStatus, imageZipFileName, imagesAttached, matchedListings, unmatchedFolders, imageFailureReason, } | No leading explanation comment; read the linked implementation. Direct named calls: `useQueryClient`, `useState`, `unmatchedFolders.join`, `activeImageStatuses.has`. |
| `VehiclePhotosCard.handleUpload` (line 81) | None | No leading explanation comment; read the linked implementation. Direct named calls: `setError`, `setIsUploading`, `setUploadProgress`, `inventoryApi.uploadImagesZip`, `setSelectedZip`, `queryClient.invalidateQueries`. |
| `UploadDetails` (line 150) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useParams`, `useQuery`, `formatFileSize`, `formatDateTime`, `rejectedRecords.map`. |
| `UploadDetails.queryFn` (line 154) | None | No leading explanation comment; read the linked implementation. Direct named calls: `inventoryApi.getUpload`. |
| `UploadDetails.refetchInterval` (line 157) | query | Poll while either stage is queued or running (including after a Retry). Direct named calls: `activeImageStatuses.has`. |
| `UploadDetails.queryFn` (line 159) | None | No leading explanation comment; read the linked implementation. Direct named calls: `inventoryApi.getRejectedRecords`. |

---

**[apps/frontend/src/portals/dealer/pages/dealerPages.test.tsx](../apps/frontend/src/portals/dealer/pages/dealerPages.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `job` (line 15) | id, overrides | No leading explanation comment; read the linked implementation. |
| `page` (line 18) | data | No leading explanation comment; read the linked implementation. |
| `renderAt` (line 20) | path, element | No leading explanation comment; read the linked implementation. Direct named calls: `render`. |

Declared test groups and cases:

- describe: bulk vehicle upload (line 34)
- it: shows the template fields for the chosen category and the upload history (line 37)
- it: uploads the chosen CSV, then opens its processing report (line 50)
- it: keeps the dealer on the page with a message when the upload or template download fails (line 62)
- it: downloads the category template as a file (line 74)
- it: shows an empty history and a history that failed to load (line 86)
- it: says when the upload history cannot be loaded (line 92)
- describe: dealer dashboard (line 99)
- it: shows totals by status, recent vehicles, recent uploads and the stale-stock reminder (line 102)
- it: says when the inventory cannot be loaded, and hides the reminder when nothing is stale (line 119)

---

**[apps/frontend/src/shared/components/PagerControls.tsx](../apps/frontend/src/shared/components/PagerControls.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `PagerControls`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `PagerControls` (line 5) | { meta, onPage, label } | Previous/next paging for admin tables, with the position and total shown in words. Direct named calls: `Math.min`. |

---

**[apps/frontend/src/shared/components/PortalLayout.tsx](../apps/frontend/src/shared/components/PortalLayout.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `PortalNavLink`, `PortalNavSection`, `PortalLayout`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `PortalLayout` (line 23) | { brand, sections, userName, userRole, onSignOut, toolbarLabel, sidebarStyle, avatarStyle } | Shared shell for the dealer and admin portals. On wide screens the sidebar is always shown; below 1024 px it becomes a drawer opened from the menu button, so every page stays reachable on phones and tablets. The drawer closes on navigation, on Escape, or by tapping outside it. Direct named calls: `useState`, `useLocation`, `useRef`, `useEffect`, `sections.map`, `getInitials`. |
| `PortalLayout.onKeyDown` (line 37) | event | No leading explanation comment; read the linked implementation. Direct named calls: `setMenuOpen`, `menuButtonRef.current?.focus`. |

---

**[apps/frontend/src/shared/components/ResponsiveTable.tsx](../apps/frontend/src/shared/components/ResponsiveTable.tsx)**

React UI, page, or layout. Component-local functions handle interactions and state changes.

Exported declarations: `ResponsiveTable`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `ResponsiveTable` (line 6) | { className, children, ...props } | A data table that turns into stacked cards on phones (see .responsive-table in index.css). Each cell is labelled with its column heading, so a card row still reads "Price: Rs 6,000,000". Labels are copied from the <th> elements after every render, so callers write a normal table. Direct named calls: `useRef`, `useLayoutEffect`. |

---

**[apps/frontend/src/shared/components/mobileLayout.test.tsx](../apps/frontend/src/shared/components/mobileLayout.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `NotificationCenter` (line 6) | None | No leading explanation comment; read the linked implementation. |
| `renderPortal` (line 11) | None | No leading explanation comment; read the linked implementation. Direct named calls: `render`, `vi.fn`. |

Declared test groups and cases:

- describe: portal navigation on phones and tablets (line 25)
- it: opens the menu as a drawer and moves focus into it (line 26)
- it: closes on Escape (focus back on the button) and after choosing a page (line 38)
- describe: tables on phones (line 53)
- it: labels every cell with its column heading, so each row can be shown as a card (line 54)

---

**[apps/frontend/src/shared/constants/vehicle.ts](../apps/frontend/src/shared/constants/vehicle.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `availableMakes`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/shared/hooks/useBodyClass.ts](../apps/frontend/src/shared/hooks/useBodyClass.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `useBodyClass`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `useBodyClass` (line 5) | className, active | Adds a class to <body> while `active`, so fixed bars (compare tray, contact bar) can make room for each other and for the page content underneath them. Direct named calls: `useEffect`. |

---

**[apps/frontend/src/shared/i18n/I18nProvider.tsx](../apps/frontend/src/shared/i18n/I18nProvider.tsx)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `languages`, `Language`, `TranslateValues`, `I18nContextValue`, `readableEnum`, `createTranslator`, `I18nContext`, `I18nProvider`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `isLanguage` (line 16) | value | No leading explanation comment; read the linked implementation. Direct named calls: `languages.some`. |
| `interpolate` (line 27) | text, values | No leading explanation comment; read the linked implementation. Direct named calls: `text.replace`. |
| `readableEnum` (line 31) | value | No leading explanation comment; read the linked implementation. Direct named calls: `value.split`. |
| `createTranslator` (line 35) | language | No leading explanation comment; read the linked implementation. |
| `createTranslator.t` (line 38) | key, values | No leading explanation comment; read the linked implementation. Direct named calls: `interpolate`. |
| `createTranslator.tEnum` (line 39) | value | No leading explanation comment; read the linked implementation. Direct named calls: `readableEnum`. |
| `initialLanguage` (line 48) | None | First visit: the browser's preferred language when it is Sinhala or Tamil, otherwise English. Direct named calls: `readStored`, `navigator.language.toLowerCase`, `preferred.startsWith`. |
| `setLanguage` (line 56) | None | No leading explanation comment; read the linked implementation. |
| `I18nProvider` (line 58) | { children } | No leading explanation comment; read the linked implementation. Direct named calls: `useState`, `useCallback`, `useEffect`, `useMemo`. |

---

**[apps/frontend/src/shared/i18n/LanguageSwitcher.tsx](../apps/frontend/src/shared/i18n/LanguageSwitcher.tsx)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `LanguageSwitcher`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `LanguageSwitcher` (line 6) | { className } | Each language is named in its own script, so a reader can find theirs whatever is showing now. Direct named calls: `useI18n`, `t`, `languages.map`. |

---

**[apps/frontend/src/shared/i18n/i18n.test.tsx](../apps/frontend/src/shared/i18n/i18n.test.tsx)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `useAuth` (line 6) | None | No leading explanation comment; read the linked implementation. Direct named calls: `vi.fn`. |
| `renderSite` (line 14) | None | No leading explanation comment; read the linked implementation. Direct named calls: `render`. |
| `placeholders` (line 34) | text | No leading explanation comment; read the linked implementation. Direct named calls: `text.match`. |

Declared test groups and cases:

- describe: Sinhala and Tamil support (line 24)
- it: translates every English message (none left empty or with a lost placeholder) (line 27)
- it: fills in placeholders and translates vehicle values (line 41)
- it: switches the whole site language, sets the page lang, and remembers the choice (line 50)
- it: starts in Tamil for a browser that prefers Tamil (line 64)

---

**[apps/frontend/src/shared/i18n/messages/en.ts](../apps/frontend/src/shared/i18n/messages/en.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `en`, `MessageKey`, `Messages`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/shared/i18n/messages/si.ts](../apps/frontend/src/shared/i18n/messages/si.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `si`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/shared/i18n/messages/ta.ts](../apps/frontend/src/shared/i18n/messages/ta.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `ta`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/shared/i18n/useI18n.ts](../apps/frontend/src/shared/i18n/useI18n.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `useI18n`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `useI18n` (line 4) | None | No leading explanation comment; read the linked implementation. Direct named calls: `useContext`. |

---

**[apps/frontend/src/shared/services/apiClient.ts](../apps/frontend/src/shared/services/apiClient.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `apiClient`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/shared/services/apiError.ts](../apps/frontend/src/shared/services/apiError.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `ApiErrorResponse`, `ApiError`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `constructor` (line 8) | statusCode, message, errors | No leading explanation comment; read the linked implementation. Direct named calls: `super`. |

---

**[apps/frontend/src/shared/services/apiServices.test.ts](../apps/frontend/src/shared/services/apiServices.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `ok` (line 29) | data, meta | No leading explanation comment; read the linked implementation. |

Declared test groups and cases:

- describe: listing API (dealer) (line 31)
- it: turns listing records into the UI model: first photo primary, missing text filled in (line 34)
- it: uses the right endpoint for each listing operation (line 43)
- it: reads stats and sends bulk actions (line 72)
- describe: buyer API (line 81)
- it: browses and searches with filters and paging (line 84)
- it: loads similar vehicles, recommendations and one vehicle with its dealer (line 94)
- describe: inventory API (line 111)
- it: uploads a CSV with its category and reports progress (line 114)
- it: lists uploads and rejected rows, and retries (line 132)
- describe: dealer API (line 153)
- it: submits an application with its documents and checks the reply (line 156)
- it: rejects a reply that does not match the expected shape (line 169)
- it: reviews applications and updates the profile (line 174)
- it: opens a verification document in a new tab, and closes the tab if loading fails (line 188)
- describe: admin API (line 204)
- it: reads every admin collection with its filters and default page size (line 207)
- it: suspends users and removes listings (line 223)

---

**[apps/frontend/src/shared/services/queryClient.ts](../apps/frontend/src/shared/services/queryClient.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `queryClient`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/shared/utils/formatters.ts](../apps/frontend/src/shared/utils/formatters.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `formatPrice`, `formatDate`, `formatDateTime`, `getInitials`, `formatMileage`, `formatFileSize`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `formatPrice` (line 1) | price, currency | No leading explanation comment; read the linked implementation. |
| `formatDate` (line 2) | value | No leading explanation comment; read the linked implementation. |
| `formatDateTime` (line 3) | value | No leading explanation comment; read the linked implementation. |
| `getInitials` (line 4) | name | No leading explanation comment; read the linked implementation. Direct named calls: `name.trim`. |
| `formatMileage` (line 5) | mileageKm | No leading explanation comment; read the linked implementation. |
| `formatFileSize` (line 6) | bytes | No leading explanation comment; read the linked implementation. |

---

**[apps/frontend/src/shared/utils/phone.test.ts](../apps/frontend/src/shared/utils/phone.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: WhatsApp numbers (line 4)
- it: adds the Sri Lankan country code to local numbers, however they are written (line 5)
- it: keeps foreign numbers and rejects ones that cannot be dialled (line 12)
- it: builds a link with the message ready to send (line 18)

---

**[apps/frontend/src/shared/utils/phone.ts](../apps/frontend/src/shared/utils/phone.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `toWhatsAppNumber`, `whatsAppLink`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `toWhatsAppNumber` (line 3) | phone | WhatsApp links need the full international number without "+" or spaces. Dealers usually enter Sri Lankan numbers in local form ("077 123 4567"), so those get the 94 country code. Direct named calls: `phone.replace`, `digits.slice`, `digits.startsWith`. |
| `whatsAppLink` (line 13) | phone, message | No leading explanation comment; read the linked implementation. Direct named calls: `toWhatsAppNumber`, `encodeURIComponent`. |

---

**[apps/frontend/src/shared/utils/safeStorage.ts](../apps/frontend/src/shared/utils/safeStorage.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `readStored`, `writeStored`, `removeStored`, `isStringArray`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `readStored` (line 4) | key, fallback, isValid | Browser storage for small per-device conveniences (language, compare list, recently viewed). Storage can be missing or throw (private windows, blocked site data), so every access is guarded and the app simply falls back to defaults. Direct named calls: `window.localStorage.getItem`, `JSON.parse`, `isValid`. |
| `writeStored` (line 15) | key, value | No leading explanation comment; read the linked implementation. Direct named calls: `window.localStorage.setItem`, `JSON.stringify`. |
| `removeStored` (line 19) | key | No leading explanation comment; read the linked implementation. Direct named calls: `window.localStorage.removeItem`. |
| `isStringArray` (line 23) | value | No leading explanation comment; read the linked implementation. Direct named calls: `Array.isArray`, `value.every`. |

---

**[apps/frontend/src/test/setup.ts](../apps/frontend/src/test/setup.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/src/vite-env.d.ts](../apps/frontend/src/vite-env.d.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/frontend/vite.config.ts](../apps/frontend/vite.config.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `manualChunks` (line 15) | id | No leading explanation comment; read the linked implementation. Direct named calls: `id.includes`. |

---

**[apps/frontend/vitest.config.ts](../apps/frontend/vitest.config.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/worker/src/benchmarks/importThroughput.bench.test.ts](../apps/worker/src/benchmarks/importThroughput.bench.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `csv` (line 17) | records | No leading explanation comment; read the linked implementation. Direct named calls: `Array.from`, `rows.join`. |

---

**[apps/worker/src/config/database.ts](../apps/worker/src/config/database.ts)**

Configuration, validated environment settings, or a shared external-service client.

Exported declarations: `connectWorkerDatabase`, `disconnectWorkerDatabase`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `connectWorkerDatabase` (line 5) | None | Opens the worker's independent MongoDB connection before queue consumption. Direct named calls: `mongoose.connect`. |
| `disconnectWorkerDatabase` (line 8) | None | Closes MongoDB after the BullMQ consumer stops accepting work. Direct named calls: `mongoose.disconnect`. |

---

**[apps/worker/src/config/env.ts](../apps/worker/src/config/env.ts)**

Configuration, validated environment settings, or a shared external-service client.

Exported declarations: `env`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/worker/src/config/mailer.ts](../apps/worker/src/config/mailer.ts)**

Configuration, validated environment settings, or a shared external-service client.

Exported declarations: `mailer`, `mailerConfig`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/worker/src/config/queue.ts](../apps/worker/src/config/queue.ts)**

Configuration, validated environment settings, or a shared external-service client.

Exported declarations: `inventoryQueueProducer`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/worker/src/config/redis.ts](../apps/worker/src/config/redis.ts)**

Configuration, validated environment settings, or a shared external-service client.

Exported declarations: `redisConnection`, `disconnectWorkerRedis`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `disconnectWorkerRedis` (line 8) | None | Releases the worker's shared Redis connection during graceful shutdown. Direct named calls: `redisConnection.quit`. |

---

**[apps/worker/src/config/storage.ts](../apps/worker/src/config/storage.ts)**

Configuration, validated environment settings, or a shared external-service client.

Exported declarations: `workerStorageClient`, `workerStorageConfig`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `mimeTypeForExtension` (line 18) | extension | No leading explanation comment; read the linked implementation. Direct named calls: `extension.toLowerCase`, `allowedMimeTypes.has`. |

---

**[apps/worker/src/drills/seedImport.ts](../apps/worker/src/drills/seedImport.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/worker/src/health.ts](../apps/worker/src/health.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `startWorkerHealthServer`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `startWorkerHealthServer` (line 12) | None | Minimal health server for the worker: - /health/live: the process is running and its event loop responds. Use this for container restarts. It deliberately ignores MongoDB and Redis: restarting every worker because a shared dependency is briefly down does not fix anything and only interrupts jobs. - /health/ready (and /health, kept for compatibility): MongoDB and Redis are connected, for dashboards and alarms. Both checks read connection state only, so they never block. Direct named calls: `createServer`, `server.listen`. |

---

**[apps/worker/src/jobs/documentRetention.job.test.ts](../apps/worker/src/jobs/documentRetention.job.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `deletedKeys` (line 13) | None | No leading explanation comment; read the linked implementation. Direct named calls: `mocks.storageSend.mock.calls.map`. |

Declared test groups and cases:

- describe: dealer document retention (line 15)
- it: only looks at decisions made more than 90 days ago (line 24)
- it: deletes every stored file, then clears the record with the deletion date (line 32)
- it: keeps the record when a storage delete fails, so the next cycle retries it (line 43)

---

**[apps/worker/src/jobs/documentRetention.job.ts](../apps/worker/src/jobs/documentRetention.job.ts)**

Background job handler or scheduled maintenance operation.

Exported declarations: `runDocumentRetention`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `runDocumentRetention` (line 13) | now | Deletes dealer verification documents (ID cards, business registrations) once the review decision is older than DEALER_DOCUMENT_RETENTION_DAYS. Files are removed from storage first; the database record is cleared only when every file of that dealer is gone, so a storage failure is simply retried on the next cycle. S3 deletes are idempotent, so retries are safe. Direct named calls: `now.getTime`, `findDealersWithExpiredDocuments`, `workerStorageClient.send`, `markDealerDocumentsDeleted`, `console.error`, `String`, `console.log`. |

---

**[apps/worker/src/jobs/emailOutbox.job.test.ts](../apps/worker/src/jobs/emailOutbox.job.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `notification` (line 13) | emailAttempts | No leading explanation comment; read the linked implementation. |

Declared test groups and cases:

- describe: email outbox (line 15)
- it: sends each due email once and marks it sent (line 22)
- it.each([[1, 60_000], [2, 5 * 60_000], [4, 2 * 60 * 60_000]]): after failed attempt %i it retries %i ms later (line 34)
- it: gives up after the fifth failed attempt and marks the email failed (line 45)
- it: marks an email failed at once when the recipient account no longer exists (line 54)
- it: processes a bounded number of emails per cycle (line 65)

---

**[apps/worker/src/jobs/emailOutbox.job.ts](../apps/worker/src/jobs/emailOutbox.job.ts)**

Background job handler or scheduled maintenance operation.

Exported declarations: `runEmailOutbox`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `runEmailOutbox` (line 15) | now | Sends queued notification emails (the outbox). Business actions only record a `pending` email; this job delivers it, retrying with increasing delays, so an SMTP outage never fails or reverses the action that caused the email. Delivery is at-least-once: a crash between sending and recording "sent" can repeat one email, which is preferable to losing it. Direct named calls: `claimNextDueEmail`, `now`, `findAuthUserById`, `markEmailFailed`, `mailer.sendMail`, `notificationEmailText`, `notificationEmailHtml`, `markEmailSent`, `String`, `scheduleEmailRetry`, `console.log`. |

---

**[apps/worker/src/jobs/inventoryImages.job.ts](../apps/worker/src/jobs/inventoryImages.job.ts)**

Background job handler or scheduled maintenance operation.

Exported declarations: `processInventoryImagesJob`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `processInventoryImagesJob` (line 8) | job | Validates the queue payload before starting durable vehicle-photos extraction. Direct named calls: `payloadSchema.parse`, `processInventoryImages`. |

---

**[apps/worker/src/jobs/inventoryUpload.job.ts](../apps/worker/src/jobs/inventoryUpload.job.ts)**

Background job handler or scheduled maintenance operation.

Exported declarations: `processInventoryUploadJob`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `processInventoryUploadJob` (line 8) | job | Validates the queue payload before starting durable inventory extraction. Direct named calls: `payloadSchema.parse`, `extractInventoryUpload`. |

---

**[apps/worker/src/jobs/reaper.job.test.ts](../apps/worker/src/jobs/reaper.job.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `bullJob` (line 21) | state | No leading explanation comment; read the linked implementation. Direct named calls: `vi.fn`. |

Declared test groups and cases:

- describe: queue reconciliation (reaper) (line 23)
- it: re-queues a pending upload whose queue message was never written (e.g. Redis was down) (line 29)
- it: re-queues photo processing whose BullMQ attempts were exhausted, under the images job id (line 40)
- it: fails a job whose durable attempt budget is used up instead of re-queuing it forever (line 52)
- it.each(['waiting', 'delayed', 'active']): leaves a job alone while its queue message is %s (line 62)

---

**[apps/worker/src/jobs/reaper.job.ts](../apps/worker/src/jobs/reaper.job.ts)**

Background job handler or scheduled maintenance operation.

Exported declarations: `ensureQueued`, `runLeaseReaper`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `ensureQueued` (line 16) | jobName, bullJobId, uploadJobId | Makes sure exactly one live queue message exists for a job. A message that is still waiting, delayed (backing off), or running is left alone; one that is missing, finished, or exhausted is replaced. BullMQ dedups add() by jobId, so the old finished message must be removed first. Direct named calls: `inventoryQueueProducer.getJob`, `ALIVE_STATES.has`, `existing.getState`, `existing.remove`, `inventoryQueueProducer.add`. |
| `exhausted` (line 26) | attempts | No leading explanation comment; read the linked implementation. |
| `runLeaseReaper` (line 33) | now | Reconciles MongoDB (the durable source of truth) with the queue: 1. Expired leases: the worker holding the job crashed or was killed mid-job. 2. Stale pending jobs: the queue message was never written (Redis down or a crash right after the MongoDB insert), was lost, or ran out of BullMQ attempts after temporary failures. Either way the job is re-queued, until its durable attempt budget is used up. Direct named calls: `upsertWorkerHeartbeat`, `now.getTime`, `Promise.all`, `findExpiredLeaseUploadJobs`, `findExpiredLeaseImageJobs`, `findStalePendingUploadJobs`, `findStalePendingImageJobs`, `String`, `failUploadJob`, `exhausted`, `ensureQueued`, `inventoryBullJobId.csv`, `failImageProcessing`, `inventoryBullJobId.images`. |

---

**[apps/worker/src/jobs/staleListingReminder.job.test.ts](../apps/worker/src/jobs/staleListingReminder.job.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: stale listing reminders (line 15)
- it: counts listings not confirmed for 60 days, and reminds at most once a week (line 23)
- it: reminds each dealer with their own count, only when this worker wins the claim (line 31)
- it: keeps going when one dealer fails, so the others are still reminded (line 44)

---

**[apps/worker/src/jobs/staleListingReminder.job.ts](../apps/worker/src/jobs/staleListingReminder.job.ts)**

Background job handler or scheduled maintenance operation.

Exported declarations: `runStaleListingReminders`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `runStaleListingReminders` (line 13) | now | Tells each dealer how many of their published listings have not been confirmed for STALE_LISTING_DAYS days, at most once every STALE_REMINDER_REPEAT_DAYS days. Safe to run on several worker copies at once: the per-dealer claim lets only one of them send the reminder. Direct named calls: `now.getTime`, `countStaleListingsByDealer`, `claimStaleListingReminder`, `notifyStaleListings`, `console.error`, `String`, `console.log`. |

---

**[apps/worker/src/pipeline/categorize.ts](../apps/worker/src/pipeline/categorize.ts)**

Worker transformation stage or helper. Follow imports from uploadJob.service.ts to establish which stages actually run.

Exported declarations: `categorize`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `categorize` (line 1) | value | No leading explanation comment; read the linked implementation. Direct named calls: `value.toLowerCase`. |

---

**[apps/worker/src/pipeline/detectDuplicates.ts](../apps/worker/src/pipeline/detectDuplicates.ts)**

Worker transformation stage or helper. Follow imports from uploadJob.service.ts to establish which stages actually run.

Exported declarations: `createListingDuplicateKey`, `detectExactDuplicates`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `createListingDuplicateKey` (line 9) | row | The registration number is a much stronger identity than title/make/model/year (which two genuinely different vehicles of the same trim could share) — it uniquely names one vehicle. Scoped globally (not per-dealer): a plate number identifies one physical vehicle regardless of which dealer account lists it, matching the manual listing form's duplicate rule. Direct named calls: `normalizeRegistrationNumber`. |
| `detectExactDuplicates` (line 12) | rows, seenKeys | Separates unique rows from duplicates found in this upload or in currently listed (draft/active) inventory. Direct named calls: `rows.map`, `findActivelyListedRegistrations`, `createListingDuplicateKey`, `seenKeys.has`, `existingKeys.has`, `duplicates.push`, `seenKeys.add`, `unique.push`. |

---

**[apps/worker/src/pipeline/enrich.ts](../apps/worker/src/pipeline/enrich.ts)**

Worker transformation stage or helper. Follow imports from uploadJob.service.ts to establish which stages actually run.

Exported declarations: `enrich`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `enrich` (line 1) | row, make, model, year | No leading explanation comment; read the linked implementation. Direct named calls: `String`. |

---

**[apps/worker/src/pipeline/extract.test.ts](../apps/worker/src/pipeline/extract.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: CSV extraction (line 5)
- it: streams records in bounded batches and reports cumulative progress (line 6)
- it: rejects rows whose column count does not match the header (line 13)

---

**[apps/worker/src/pipeline/extract.ts](../apps/worker/src/pipeline/extract.ts)**

Worker transformation stage or helper. Follow imports from uploadJob.service.ts to establish which stages actually run.

Exported declarations: `ExtractedInventoryRow`, `extractCsvBatches`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `extractCsvBatches` (line 9) | stream, batchSize, onBatch, skipRecords | Streams CSV records into bounded batches without loading the entire file into memory. skipRecords resumes after a checkpoint: those leading records are parsed but not re-processed, and processedRecords keeps counting from the start of the file so row numbers stay stable. Direct named calls: `stream.pipe`, `parse`, `batch.push`, `onBatch`. |

---

**[apps/worker/src/pipeline/generateEmbedding.ts](../apps/worker/src/pipeline/generateEmbedding.ts)**

Worker transformation stage or helper. Follow imports from uploadJob.service.ts to establish which stages actually run.

Exported declarations: `generateEmbedding`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `generateEmbedding` (line 6) | text | Uses the configured semantic model, while keeping local imports operational without a hosted key. Direct named calls: `text.trim`, `createLocalSearchEmbedding`, `axios.post`, `encodeURIComponent`, `normalizeEmbeddingResponse`. |

---

**[apps/worker/src/pipeline/normalize.test.ts](../apps/worker/src/pipeline/normalize.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: inventory normalization (line 4)
- it: normalizes common fields, enums, numbers, and supported price suffixes for a car row (line 5)
- it: normalizes hyphenated and underscored enum aliases the same way (line 16)
- it: restores a CSV title truncated to a prefix of make and model (line 21)
- it: preserves a title with additional information instead of replacing it (line 26)
- it: leaves optional powertrain fields unset when the CSV cell is blank (line 31)
- it: builds motorcycle-specific attributes instead of car attributes (line 37)

---

**[apps/worker/src/pipeline/normalize.ts](../apps/worker/src/pipeline/normalize.ts)**

Worker transformation stage or helper. Follow imports from uploadJob.service.ts to establish which stages actually run.

Exported declarations: `normalizeCommonFields`, `normalizeAttributes`, `normalizeInventoryRow`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `normalizeNumber` (line 7) | value | Converts supported plain, million, and lakh number representations into a JS number. Returns undefined for blank cells so optional fields (e.g. battery specs on a petrol car) stay unset instead of failing validation as NaN. Direct named calls: `compact.endsWith`, `Number`, `compact.replace`, `Number.isNaN`. |
| `titleCase` (line 16) | value | Produces consistent title case for searchable names and locations. Direct named calls: `value.trim`. |
| `normalizeEnumValue` (line 21) | value | Normalizes CSV enum aliases into the snake_case values used across vehicleCategories, fuelTypes, transmissionTypes, vehicleConditions, carBodyTypes, and motorcycleTypes — "Plug-in Hybrid" / "plug in hybrid" / "PLUG_IN_HYBRID" all resolve to "plug_in_hybrid". |
| `normalizeCsvTitle` (line 23) | title, make, model | No leading explanation comment; read the linked implementation. Direct named calls: `title.trim`, `fullVehicleName.toLowerCase`, `normalizedTitle.toLowerCase`. |
| `normalizeCommonFields` (line 32) | row | Common fields shared by every category's CSV row. Direct named calls: `row.description?.trim`, `titleCase`, `normalizeCsvTitle`, `normalizeNumber`, `row.currency?.trim`. |
| `pickNumber` (line 49) | key, raw | No leading explanation comment; read the linked implementation. Direct named calls: `normalizeNumber`. |
| `normalizePowertrainAttributes` (line 51) | row | No leading explanation comment; read the linked implementation. Direct named calls: `normalizeEnumValue`, `pickNumber`. |
| `normalizeAttributes` (line 64) | category, row | Builds the category-specific `attributes` object for one CSV row. Unrecognized/irrelevant columns for the selected category are simply not read — the CSV template only includes the columns that apply, but stray extra columns from a hand-edited file are harmlessly ignored. Direct named calls: `normalizePowertrainAttributes`, `row.edition?.trim`, `normalizeEnumValue`, `pickNumber`. |
| `normalizeInventoryRow` (line 89) | category, row | Converts one extracted CSV row into the shape listingRowSchema (from @motorx/shared-contracts) validates: common fields at the top level, plus the category-discriminated attributes object. Direct named calls: `normalizeCommonFields`, `normalizeAttributes`. |

---

**[apps/worker/src/pipeline/persist.ts](../apps/worker/src/pipeline/persist.ts)**

Worker transformation stage or helper. Follow imports from uploadJob.service.ts to establish which stages actually run.

Exported declarations: `persistValidRows`, `persistRejectedRows`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `persistValidRows` (line 9) | dealerId, uploadJobId, rows | Applies trusted ownership fields before inserting validated rows as drafts. Direct named calls: `Promise.all`, `Array.from`, `Math.min`, `insertImportedListings`. |
| `persistRejectedRows` (line 26) | records | Persists rejected rows without allowing one invalid record to block valid listings. Direct named calls: `insertRejectedRecords`. |

---

**[apps/worker/src/pipeline/transform.test.ts](../apps/worker/src/pipeline/transform.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: inventory batch transformation (line 4)
- it: separates valid and invalid rows while retaining CSV row numbers (line 5)
- it: validates a full electric-car CSV row example end to end (line 13)
- it: rejects a mixed batch by row without discarding the valid rows in it (line 21)

---

**[apps/worker/src/pipeline/transform.ts](../apps/worker/src/pipeline/transform.ts)**

Worker transformation stage or helper. Follow imports from uploadJob.service.ts to establish which stages actually run.

Exported declarations: `PreparedInventoryRow`, `InvalidInventoryRow`, `prepareInventoryBatch`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `prepareInventoryBatch` (line 11) | category, rows, firstRowNumber | Normalizes and validates a batch (against the upload's chosen vehicle category) while preserving source rows for correction reports. Direct named calls: `rows.forEach`. |

---

**[apps/worker/src/pipeline/validate.test.ts](../apps/worker/src/pipeline/validate.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `carRow` (line 5) | attributes | No leading explanation comment; read the linked implementation. |

Declared test groups and cases:

- describe: car row validation (line 7)
- it: accepts a petrol car with an engine capacity (line 8)
- it: accepts a diesel car with an engine capacity (line 12)
- it: accepts a hybrid car with engine capacity and no battery specs (line 16)
- it: accepts an electric car with battery specs and no engine capacity (line 20)
- it: accepts a plug-in hybrid with both engine capacity and battery specs (line 24)
- it: rejects a petrol car missing engine capacity (line 28)
- it: rejects an electric car missing battery capacity and range (line 34)
- it: rejects an invalid body type (line 43)
- it: returns multiple field-level errors for a broadly invalid row (line 48)
- describe: other category row validation (line 55)
- it: accepts a valid motorcycle (line 58)
- it: rejects a motorcycle with an invalid bikeType (line 62)
- it: accepts a valid van (line 66)
- it: accepts a valid truck (line 70)
- it: rejects a truck missing engine capacity for a combustion fuel type (line 74)
- it: accepts a valid three-wheeler (line 78)
- it: accepts an electric three-wheeler without engine capacity (line 82)
- it: accepts a valid bus (line 86)

---

**[apps/worker/src/pipeline/validate.ts](../apps/worker/src/pipeline/validate.ts)**

Worker transformation stage or helper. Follow imports from uploadJob.service.ts to establish which stages actually run.

Exported declarations: `ValidInventoryRow`, `validateInventoryRow`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `validateInventoryRow` (line 7) | row | Validates one normalized CSV row against the same category-discriminated schema (common fields + conditional fuel-type rules) the backend's manual listing form uses. Direct named calls: `listingRowSchema.safeParse`, `result.error.issues.map`. |

---

**[apps/worker/src/repositories/authUser.repository.ts](../apps/worker/src/repositories/authUser.repository.ts)**

Persistence operations: reads or writes stored records for the owning feature.

Exported declarations: `WorkerAuthUser`, `findAuthUserById`, `findAdminUserIds`, `claimStaleListingReminder`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `findAuthUserById` (line 12) | userId | Looks up the dealer's contact details for the completion email. auth-users is backend-owned; the worker's only write is the stale-stock reminder marker below. Direct named calls: `AuthUserModel.findById`. |
| `findAdminUserIds` (line 17) | None | Fans admin-only advisory notifications (high rejection rate) out to every active administrator. Direct named calls: `AuthUserModel.find`, `admins.map`. |
| `claimStaleListingReminder` (line 26) | dealerUserId, notRemindedSince, now | Records that a dealer is being reminded about stale stock, but only if they were not reminded since `notRemindedSince`. Atomic, so two worker copies running the same cycle never both send the reminder: only the one whose update matched goes on to notify. (staleReminderSentAt is the one field the worker writes here; the backend model ignores it.) Direct named calls: `AuthUserModel.updateOne`. |

---

**[apps/worker/src/repositories/dealerDocument.repository.ts](../apps/worker/src/repositories/dealerDocument.repository.ts)**

Persistence operations: reads or writes stored records for the owning feature.

Exported declarations: `RetainedDealerDocuments`, `findDealersWithExpiredDocuments`, `markDealerDocumentsDeleted`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `findDealersWithExpiredDocuments` (line 15) | cutoff, limit | Reviewed applications whose decision is older than the cutoff and still have stored files. Direct named calls: `DealerModel.find`. |
| `markDealerDocumentsDeleted` (line 24) | dealerId, deletedAt | Clears the document list only after every file was deleted from storage, and records when. Direct named calls: `DealerModel.updateOne`. |

---

**[apps/worker/src/repositories/jobSafety.db.test.ts](../apps/worker/src/repositories/jobSafety.db.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `jobs` (line 14) | None | No leading explanation comment; read the linked implementation. Direct named calls: `mongoose.connection.collection`. |
| `createPendingJob` (line 23) | None | No leading explanation comment; read the linked implementation. Direct named calls: `jobs`, `String`. |

Declared test groups and cases:

- describe.skipIf(!safeUri): job safety guarantees in MongoDB (line 12)
- it: lets only the current lease owner write once an expired lease is taken over (line 28)
- it: does not let a second worker claim a job whose lease is still valid (line 42)
- it: never stores two listings for the same CSV row of the same upload (line 49)
- it: records each rejected row once, even when the batch is processed again (line 61)

---

**[apps/worker/src/repositories/listing.repository.ts](../apps/worker/src/repositories/listing.repository.ts)**

Persistence operations: reads or writes stored records for the owning feature.

Exported declarations: `ImportableListing`, `WorkerListingImage`, `findActivelyListedRegistrations`, `countOpenDealerListings`, `findImportedRowNumbers`, `insertImportedListings`, `findListingsByUploadJob`, `appendListingImages`, `countStaleListingsByDealer`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `findActivelyListedRegistrations` (line 24) | normalizedRegistrationNumbers | Returns which of the given normalized registration numbers already belong to a currently listed (draft/active) vehicle — archived/sold listings don't block a CSV row from importing. Direct named calls: `ListingModel.find`, `matches.map`. |
| `countOpenDealerListings` (line 31) | dealerId | Drafts and active listings count toward the per-dealer listing limit. Direct named calls: `ListingModel.countDocuments`. |
| `findImportedRowNumbers` (line 36) | uploadJobId, rowNumbers | Returns which of these CSV row numbers an earlier attempt of this upload already imported. Direct named calls: `ListingModel.find`, `rows.map`. |
| `insertImportedListings` (line 43) | rows | Inserts validated draft listings as one ordered batch owned by the upload's dealer. Direct named calls: `ListingModel.insertMany`, `rows.map`. |
| `findListingsByUploadJob` (line 49) | uploadJobId | Loads every listing this exact upload job created, for matching against zip folder names. Direct named calls: `ListingModel.find`. |
| `appendListingImages` (line 55) | listingId, images, maximum | Appends photos to one listing, capped at the configured per-listing image limit. Refuses the whole append if any of these keys is already attached, so overlapping attempts cannot duplicate. Direct named calls: `ListingModel.updateOne`, `images.map`. |
| `countStaleListingsByDealer` (line 65) | cutoff, limit | Dealers with active listings not confirmed since `cutoff`, with how many. Listings saved before lastConfirmedAt existed fall back to their last update time (same rule as the dealer's stale list). Direct named calls: `ListingModel.aggregate`. |

---

**[apps/worker/src/repositories/models.ts](../apps/worker/src/repositories/models.ts)**

Database shapes, Mongoose models, and indexes. Models describe stored documents; they do not open the database connection.

Exported declarations: `UploadJobModel`, `ListingModel`, `AuditLogModel`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[apps/worker/src/repositories/notification.repository.ts](../apps/worker/src/repositories/notification.repository.ts)**

Persistence operations: reads or writes stored records for the owning feature.

Exported declarations: `NotificationChannel`, `NotificationEmailStatus`, `NotificationDetails`, `WorkerNotification`, `createNotification`, `claimNextDueEmail`, `markEmailSent`, `scheduleEmailRetry`, `markEmailFailed`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `createNotification` (line 47) | input | Records the notification. The email leg (if any) is only queued here: `pending` rows are sent by the outbox job, so creating a notification never waits on, or fails because of, SMTP. Direct named calls: `input.channels.includes`, `NotificationModel.create`. |
| `claimNextDueEmail` (line 56) | now | Atomically takes the oldest due email, so several workers never send the same one at once. A claim that is never finished (the worker died mid-send) becomes available again after CLAIM_MS. Direct named calls: `NotificationModel.findOneAndUpdate`, `now.getTime`. |
| `markEmailSent` (line 70) | notificationId | No leading explanation comment; read the linked implementation. Direct named calls: `NotificationModel.updateOne`. |
| `scheduleEmailRetry` (line 74) | notificationId, nextAttemptAt, error | No leading explanation comment; read the linked implementation. Direct named calls: `NotificationModel.updateOne`, `error.slice`. |
| `markEmailFailed` (line 78) | notificationId, error | No leading explanation comment; read the linked implementation. Direct named calls: `NotificationModel.updateOne`, `error.slice`. |

---

**[apps/worker/src/repositories/rejectedRecord.repository.ts](../apps/worker/src/repositories/rejectedRecord.repository.ts)**

Persistence operations: reads or writes stored records for the owning feature.

Exported declarations: `RejectedInventoryRecord`, `insertRejectedRecords`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `insertRejectedRecords` (line 16) | records | Persists invalid and duplicate rows for dealer correction later. Insert-once per (upload, row): re-running a batch after a crash leaves the existing records untouched. Direct named calls: `RejectedRecordModel.bulkWrite`, `records.map`. |

---

**[apps/worker/src/repositories/uploadJob.repository.ts](../apps/worker/src/repositories/uploadJob.repository.ts)**

Persistence operations: reads or writes stored records for the owning feature.

Exported declarations: `ImageProcessingStatus`, `WorkerUploadJob`, `JOB_LEASE_MS`, `ProcessingCounts`, `claimPendingUploadJob`, `renewUploadLease`, `updateUploadProgress`, `completeUploadJob`, `failUploadJob`, `retryUploadJob`, `claimPendingImageProcessing`, `renewImageLease`, `completeImageProcessing`, `failImageProcessing`, `retryImageProcessing`, `findExpiredLeaseUploadJobs`, `findExpiredLeaseImageJobs`, `findStalePendingUploadJobs`, `findStalePendingImageJobs`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `leaseUntil` (line 31) | now | No leading explanation comment; read the linked implementation. Direct named calls: `now.getTime`. |
| `claimPendingUploadJob` (line 41) | uploadJobId, leaseOwner | --------------------------------------------------------------------------------------------- CSV extraction stage. Every write made while processing requires the caller's lease-owner token, so a worker whose lease expired (and was taken over) can no longer change the job. --------------------------------------------------------------------------------------------- Claims pending work, or work whose lease expired because its worker crashed. Direct named calls: `UploadJobModel.findOneAndUpdate`, `leaseUntil`. |
| `renewUploadLease` (line 51) | uploadJobId, leaseOwner | Extends the lease while this owner still holds it; false means the job was taken over. Direct named calls: `UploadJobModel.updateOne`, `leaseUntil`. |
| `updateUploadProgress` (line 57) | uploadJobId, leaseOwner, counts | Saves cumulative counters after a batch is durably persisted: the checkpoint a retry resumes from. Direct named calls: `UploadJobModel.updateOne`, `leaseUntil`. |
| `completeUploadJob` (line 63) | uploadJobId, leaseOwner, counts | Marks a fully processed upload using error-aware terminal status semantics. Direct named calls: `UploadJobModel.updateOne`. |
| `failUploadJob` (line 74) | uploadJobId, failureReason, leaseOwner | Records a terminal failure. With a lease owner, only that owner may fail the job; without one (the reaper), only a job still in the expected state is changed. Direct named calls: `UploadJobModel.updateOne`, `failureReason.slice`. |
| `retryUploadJob` (line 81) | uploadJobId, leaseOwner, failureReason | Hands the job back as pending (temporary failure or shutdown) so a later attempt resumes it. Direct named calls: `UploadJobModel.updateOne`, `failureReason.slice`. |
| `claimPendingImageProcessing` (line 93) | uploadJobId, leaseOwner | --------------------------------------------------------------------------------------------- Image stage: same lease rules, with its own attempt counter. --------------------------------------------------------------------------------------------- Direct named calls: `UploadJobModel.findOneAndUpdate`, `leaseUntil`. |
| `renewImageLease` (line 102) | uploadJobId, leaseOwner | No leading explanation comment; read the linked implementation. Direct named calls: `UploadJobModel.updateOne`, `leaseUntil`. |
| `completeImageProcessing` (line 109) | uploadJobId, leaseOwner, result | Marks image processing complete, recording how many photos were attached and which folders in the zip didn't match any listing this upload job created. Direct named calls: `UploadJobModel.updateOne`. |
| `failImageProcessing` (line 118) | uploadJobId, failureReason, leaseOwner | No leading explanation comment; read the linked implementation. Direct named calls: `UploadJobModel.updateOne`, `failureReason.slice`. |
| `retryImageProcessing` (line 124) | uploadJobId, leaseOwner, failureReason | No leading explanation comment; read the linked implementation. Direct named calls: `UploadJobModel.updateOne`, `failureReason.slice`. |
| `findExpiredLeaseUploadJobs` (line 137) | now | --------------------------------------------------------------------------------------------- Reaper / reconciliation queries. --------------------------------------------------------------------------------------------- Jobs whose lease outlived the worker that claimed them (it crashed or was killed mid-job). Direct named calls: `UploadJobModel.find`. |
| `findExpiredLeaseImageJobs` (line 141) | now | No leading explanation comment; read the linked implementation. Direct named calls: `UploadJobModel.find`. |
| `findStalePendingUploadJobs` (line 148) | pendingSince | Jobs that have been pending longer than expected: their queue message may never have been written (Redis down or a crash right after the MongoDB insert), or it was lost or exhausted. The MongoDB record is the durable source of truth, so these are re-enqueued from here. Direct named calls: `UploadJobModel.find`. |
| `findStalePendingImageJobs` (line 152) | pendingSince | No leading explanation comment; read the linked implementation. Direct named calls: `UploadJobModel.find`. |

---

**[apps/worker/src/repositories/workerHeartbeat.repository.ts](../apps/worker/src/repositories/workerHeartbeat.repository.ts)**

Persistence operations: reads or writes stored records for the owning feature.

Exported declarations: `upsertWorkerHeartbeat`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `upsertWorkerHeartbeat` (line 7) | None | Writes a single timestamped doc the backend's admin system-health endpoint reads to approximate worker liveness (a separate container it has no other way to observe). |

---

**[apps/worker/src/services/activeLeases.ts](../apps/worker/src/services/activeLeases.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `LeaseStage`, `trackLease`, `untrackLease`, `listActiveLeases`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `trackLease` (line 7) | uploadJobId, stage, owner | No leading explanation comment; read the linked implementation. Direct named calls: `active.set`. |
| `untrackLease` (line 8) | owner | No leading explanation comment; read the linked implementation. Direct named calls: `active.delete`. |
| `listActiveLeases` (line 9) | None | No leading explanation comment; read the linked implementation. Direct named calls: `active.values`. |

---

**[apps/worker/src/services/emailTemplate.ts](../apps/worker/src/services/emailTemplate.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `notificationEmailHtml`, `notificationEmailText`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `escapeHtml` (line 3) | value | No leading explanation comment; read the linked implementation. Direct named calls: `value.replace`. |
| `detailRows` (line 9) | details | No leading explanation comment; read the linked implementation. Direct named calls: `Object.entries`. |
| `notificationEmailHtml` (line 15) | title, message, details | The one MotorX notification email layout, used for every email the outbox sends. Direct named calls: `detailRows`, `escapeHtml`. |
| `notificationEmailText` (line 21) | title, message, details | No leading explanation comment; read the linked implementation. Direct named calls: `Object.entries`, `lines.join`. |

---

**[apps/worker/src/services/imageProcessing.service.test.ts](../apps/worker/src/services/imageProcessing.service.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `fakeEntry` (line 12) | path, type, content | No leading explanation comment; read the linked implementation. |
| `fakeEntry.buffer` (line 13) | None | No leading explanation comment; read the linked implementation. |
| `fakeEntry.stream` (line 13) | None | No leading explanation comment; read the linked implementation. Direct named calls: `Readable.from`. |
| `mimeTypeForExtension` (line 20) | extension | No leading explanation comment; read the linked implementation. Direct named calls: `extension.toLowerCase`. |
| `storedObjects` (line 39) | None | Uploaded objects are every storage call after the initial zip download. Direct named calls: `mocks.storageSend.mock.calls.slice`. |
| `transformToByteArray` (line 46) | None | No leading explanation comment; read the linked implementation. |
| `buffer` (line 137) | None | No leading explanation comment; read the linked implementation. |
| `stream` (line 138) | None | No leading explanation comment; read the linked implementation. Direct named calls: `Readable.from`. |
| `files` (line 232) | None | No leading explanation comment; read the linked implementation. Direct named calls: `fakeEntry`. |
| `transformToByteArray` (line 242) | None | No leading explanation comment; read the linked implementation. |

Declared test groups and cases:

- describe: inventory image processing (line 41)
- it: matches a zip folder to a listing by normalized registration number and attaches images (line 51)
- it: groups entries whose zip path uses backslashes (PowerShell Compress-Archive) the same as forward slashes (line 68)
- it: matches images when the zip contains an extra wrapper folder (line 78)
- it: records a folder that matches no listing from this upload job as unmatched (line 88)
- it: skips root-level files with no folder and non-image files (line 98)
- it: caps attached images at the configured per-listing limit, accounting for existing images (line 114)
- it: fails immediately (no retry) on an entry that exceeds the expanded size limit, without buffering it in full (line 130)
- it: stores a re-encoded WebP with all metadata (including GPS location) removed (line 151)
- it: skips a file that only starts like a JPEG but cannot be decoded (line 166)
- it: skips an image above the pixel cap even when the file itself is small (line 177)
- it: shrinks large photos to the maximum stored dimension (line 190)
- it: also stores an 800 px small copy for cards and phones, and links it on the listing (line 201)
- it: retries a temporary storage failure with backoff instead of failing the job (line 215)
- it: fails immediately when the upload is not a zip archive at all (line 223)
- it: is idempotent: a retry after a crash does not attach the same photos again (line 230)
- it: derives the same key for the same photo and a different key for different content (line 253)
- it: fails at once with an actionable reason (not a silent 0/0) when no photo is inside a folder (line 261)

---

**[apps/worker/src/services/imageProcessing.service.ts](../apps/worker/src/services/imageProcessing.service.ts)**

Business operations and orchestration; see each function and its direct calls below.

Exported declarations: `InvalidArchiveError`, `deterministicImageKey`, `processInventoryImages`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `constructor` (line 18) | message | No leading explanation comment; read the linked implementation. Direct named calls: `super`. |
| `downloadZipBuffer` (line 22) | storageKey | Downloads the private zip as one buffer. Bounded by the backend's zip size cap at upload time, so buffering the whole archive here (rather than streaming) keeps the extraction logic simple. Direct named calls: `workerStorageClient.send`, `Buffer.from`, `object.Body.transformToByteArray`. |
| `fullObjectKey` (line 32) | key | No leading explanation comment; read the linked implementation. |
| `thumbObjectKey` (line 33) | key | No leading explanation comment; read the linked implementation. |
| `imageMimeType` (line 35) | buffer | No leading explanation comment; read the linked implementation. Direct named calls: `buffer.subarray`, `Buffer.from`. |
| `readEntryWithinLimit` (line 46) | entry, limitBytes | Reads a zip entry while enforcing limitBytes as it decompresses, rather than after fully inflating it — a hand-crafted entry can lie about its declared size, so the only way to cap actual memory use against a decompression bomb is to stop reading mid-stream once the real byte count crosses the limit, instead of trusting metadata or buffering first. |
| `extractImageEntries` (line 73) | zipBuffer | Extracts image entries from the zip, grouped by the folder that directly contains each photo (the vehicle's registration number), so both CAX-1234/photo.jpg and an extra wrapper folder such as Photos/CAX-1234/photo.jpg work. Root-level files (no folder), non-image files, and images that cannot be decoded are skipped — a hand-built zip may contain extras, and one bad file shouldn't fail the whole batch. Direct named calls: `unzipper.Open.buffer`, `entry.path.split`, `fileName.split`, `workerStorageConfig.mimeTypeForExtension`, `Math.max`, `Math.min`, `readEntryWithinLimit`, `imageMimeType`, `reencodeListingPhoto`, `normalizeRegistrationNumber`, `grouped.get`, `list.push`, `segments.join`, `createHash`, `makeListingThumb`, `grouped.set`. |
| `deterministicImageKey` (line 121) | uploadJobId, listingId, entry | The same photo from the same upload always gets the same storage key, so a retry after a crash overwrites the object it already wrote (no orphans) and recognises photos it already attached. Formatted like a UUID to satisfy the public image-key format. Direct named calls: `createHash`, `hex.slice`. |
| `uploadImage` (line 127) | key, order, entry | Uploads one re-encoded photo (and its small copy) under its deterministic key and returns its ListingImage metadata. Direct named calls: `Promise.all`, `put`, `fullObjectKey`, `thumbObjectKey`, `encodeURIComponent`. |
| `uploadImage.put` (line 128) | objectKey, body | No leading explanation comment; read the linked implementation. Direct named calls: `workerStorageClient.send`. |
| `processInventoryImages` (line 141) | uploadJobId | Downloads, extracts, matches, and attaches a vehicle-photos zip to the listings this exact upload job created — matched by normalized registration number (the zip's folder names), so a zip can never attach photos to another dealer's or another job's listings. Safe to retry at any point: photos already attached by an earlier attempt are recognised by their key. Direct named calls: `randomUUID`, `claimPendingImageProcessing`, `console.warn`, `holdLease`, `trackLease`, `downloadZipBuffer`, `extractImageEntries`, `findListingsByUploadJob`, `listings.map`, `lease.assertHeld`, `listingsByRegistration.get`, `unmatchedFolders.push`, `String`, `existing.map`, `entries.map`, `keyed.filter`, `Math.max`, `Promise.all`, `toAttach.map`, `appendListingImages`, `Promise.allSettled`, `images.flatMap`, `completeImageProcessing`, `notifyImageProcessingResult`, `isTransientError`, `retryImageProcessing`, `failImageProcessing`, `lease.stop`, `untrackLease`. |

---

**[apps/worker/src/services/imageReencode.ts](../apps/worker/src/services/imageReencode.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `reencodeListingPhoto`, `makeListingThumb`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `reencodeListingPhoto` (line 10) | input | Rebuilds a listing photo as a fresh WebP from its decoded pixels (same rules as the backend's direct uploads): drops hidden trailing data and all metadata such as EXIF GPS location, keeps the photo upright, caps its size, and refuses images above the pixel limit before decoding. Returns null for anything that is not a decodable JPEG, PNG, or WebP so callers can skip it. Direct named calls: `sharp`, `image.metadata`, `decodableFormats.has`. |
| `makeListingThumb` (line 26) | cleanWebp | Makes the small copy (max 800 px) shown on cards and phones from an already cleaned photo. Direct named calls: `sharp`. |

---

**[apps/worker/src/services/jobLease.test.ts](../apps/worker/src/services/jobLease.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: holdLease (line 7)
- it: renews the lease every third of its duration while work continues (line 11)
- it: reports the lease as lost once another worker owns the job (line 23)
- it: keeps the lease through a temporary renewal error and tries again next time (line 32)
- it: stops renewing when the job ends (line 43)

---

**[apps/worker/src/services/jobLease.ts](../apps/worker/src/services/jobLease.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `LeaseLostError`, `HeldLease`, `holdLease`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `constructor` (line 6) | uploadJobId | No leading explanation comment; read the linked implementation. Direct named calls: `super`. |
| `holdLease` (line 18) | uploadJobId, owner, renew, intervalMs | Renews the lease every third of its duration while the job runs. A failed renewal caused by a database hiccup is retried on the next tick; only "another worker owns it" marks the lease lost. Direct named calls: `setInterval`, `timer.unref`. |
| `holdLease.assertHeld` (line 28) | None | No leading explanation comment; read the linked implementation. |
| `holdLease.stop` (line 29) | None | No leading explanation comment; read the linked implementation. Direct named calls: `clearInterval`. |

---

**[apps/worker/src/services/notification.service.ts](../apps/worker/src/services/notification.service.ts)**

Business operations and orchestration; see each function and its direct calls below.

Exported declarations: `notifyUploadJobResult`, `notifyUploadHighRejectionRate`, `notifyImageProcessingResult`, `notifyStaleListings`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `notify` (line 8) | userId, type, title, message, channels, details | Records one notification. Emails are queued (sent later by the outbox job), and a failure to record a notification is logged, never thrown: a notification must not fail or appear to fail the import or photo processing that has already completed. Direct named calls: `createNotification`, `console.error`, `String`. |
| `notifyMany` (line 13) | userIds, type, title, message, channels | No leading explanation comment; read the linked implementation. Direct named calls: `Promise.all`, `userIds.map`. |
| `notifyUploadJobResult` (line 19) | dealerUserId, uploadJobId, status, counts, failureReason | Notifies the dealer once a CSV upload job reaches a terminal state, matching the delivery strategy: clean completion stays in-app only, failures/partial failures also send an email. Direct named calls: `notify`. |
| `notifyUploadHighRejectionRate` (line 30) | uploadJobId, rejectionRate | Advisory-only signal for administrators when a job's rejection rate crosses the threshold — not urgent enough to leave the app for, per the delivery strategy, so in-app only. Direct named calls: `findAdminUserIds`, `notifyMany`, `Math.round`. |
| `notifyImageProcessingResult` (line 36) | dealerUserId, status, unmatchedFolders, failureReason | Notifies the dealer once vehicle-photo zip processing reaches a terminal state. Direct named calls: `notify`. |
| `notifyStaleListings` (line 44) | dealerUserId, staleListings, days | Reminds a dealer about listings nobody has confirmed for a while, so buyers do not contact them about cars already sold. In-app only: it repeats weekly, which would be too often for email. Direct named calls: `notify`. |

---

**[apps/worker/src/services/transientError.test.ts](../apps/worker/src/services/transientError.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

Declared test groups and cases:

- describe: isTransientError (line 4)
- it.each([ ['a dropped connection', Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' })], ['S3 throttling', Object.assign(new Error('Please reduce your request rate.'), { name: 'SlowDown' })], ['an S3 5xx response', Object.assign(new Error('Internal'), { $metadata: { httpStatusCode: 503 } })], ['an SDK-marked retryable error', Object.assign(new Error('x'), { $retryable: { throttling: false } })], ['MongoDB being unreachable', Object.assign(new Error('Server selection timed out'), { name: 'MongoServerSelectionError' })], ['a wrapped network error', new Error('download failed', { cause: Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }) })], ]): retries %s (line 5)
- it.each([ ['a missing file', Object.assign(new Error('The specified key does not exist.'), { name: 'NoSuchKey', $metadata: { httpStatusCode: 404 } })], ['access denied', Object.assign(new Error('Access Denied'), { name: 'AccessDenied', $metadata: { httpStatusCode: 403 } })], ['a CSV parse error', Object.assign(new Error('Invalid Record Length'), { code: 'CSV_RECORD_INCONSISTENT_COLUMNS' })], ['a duplicate key error', Object.assign(new Error('E11000 duplicate key error'), { name: 'MongoServerError', code: 11000 })], ['a programming error', new TypeError('Cannot read properties of undefined')], ['a non-error value', 'boom'], ]): does not retry %s (line 16)

---

**[apps/worker/src/services/transientError.ts](../apps/worker/src/services/transientError.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `isTransientError`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `isTransientError` (line 12) | error | Decides whether a failure is worth retrying: network blips, storage throttling or 5xx errors, and database connectivity loss. Anything else (bad CSV, invalid archive, missing file, programming errors) is permanent, so retrying would only repeat the same failure. Direct named calls: `TRANSIENT_ERROR_NAMES.has`, `TRANSIENT_NETWORK_CODES.has`, `candidate.hasErrorLabel`, `isTransientError`. |

---

**[apps/worker/src/services/uploadJob.service.test.ts](../apps/worker/src/services/uploadJob.service.test.ts)**

Automated tests; the test names below state the behavior being checked. A test declaration is not evidence of a passing run.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `car` (line 24) | registration | No leading explanation comment; read the linked implementation. |
| `insertedRowNumbers` (line 26) | None | No leading explanation comment; read the linked implementation. Direct named calls: `mocks.insertListings.mock.calls.flatMap`. |

Declared test groups and cases:

- describe: inventory upload ETL service (line 28)
- it: persists valid rows, records invalid rows, and completes with accurate counters (line 39)
- it: uses one lease-owner token for the claim and every later write (line 47)
- it: fails permanently (and tells the dealer) when the CSV itself cannot be parsed (line 56)
- it: hands a temporary storage failure back as pending and rethrows so BullMQ retries with backoff (line 64)
- it: fails a temporary failure once the durable attempt budget is used up (line 71)
- it: routes duplicate registration numbers to rejected records instead of listings (line 78)
- it: resumes after a crash from the last checkpoint without importing any row twice (line 85)
- it: rejects rows beyond the dealer's listing limit instead of importing them (line 100)
- it: stops without writing when another worker has taken over the lease (line 111)

---

**[apps/worker/src/services/uploadJob.service.ts](../apps/worker/src/services/uploadJob.service.ts)**

Business operations and orchestration; see each function and its direct calls below.

Exported declarations: `extractInventoryUpload`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `downloadInventoryStream` (line 23) | storageKey | Downloads the private original CSV as a Node stream for bounded-memory parsing. Direct named calls: `workerStorageClient.send`. |
| `processInventoryBatch` (line 32) | uploadJobId, lease, dealerId, category, rows, processedRecords, counts, seenKeys | Transforms and persists one batch, then checkpoints the cumulative counters. Safe to run again for the same rows: rows an earlier attempt already imported are counted, not re-inserted, and rejected rows are insert-once. Direct named calls: `lease.assertHeld`, `prepareInventoryBatch`, `findImportedRowNumbers`, `prepared.valid.map`, `prepared.valid.filter`, `seenKeys.add`, `createListingDuplicateKey`, `detectExactDuplicates`, `Math.max`, `countOpenDealerListings`, `duplicateResult.unique.splice`, `overLimit.map`, `prepared.invalid.map`, `duplicateResult.duplicates.map`, `Promise.all`, `persistValidRows`, `persistRejectedRows`, `updateUploadProgress`. |
| `extractInventoryUpload` (line 60) | uploadJobId | Claims, downloads, and extracts one upload. A retry resumes after the last checkpoint. Temporary failures hand the job back as pending (BullMQ retries it with backoff); permanent ones, or running out of attempts, fail it and tell the dealer. Direct named calls: `randomUUID`, `claimPendingUploadJob`, `console.warn`, `holdLease`, `trackLease`, `downloadInventoryStream`, `extractCsvBatches`, `lease.assertHeld`, `completeUploadJob`, `notifyUploadJobResult`, `notifyUploadHighRejectionRate`, `isTransientError`, `retryUploadJob`, `failUploadJob`, `lease.stop`, `untrackLease`. |

---

**[apps/worker/src/worker.ts](../apps/worker/src/worker.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `releaseActiveLeases` (line 19) | None | Returns every job this process still holds to pending, using its own lease token so a job another worker has already taken over is never touched. Returns how many were released. Direct named calls: `listActiveLeases`, `Promise.allSettled`, `leases.map`, `results.filter`. |
| `processInventoryJob` (line 28) | job | Both job types share one queue; this dispatches by name to the right handler. Direct named calls: `processInventoryUploadJob`, `processInventoryImagesJob`. |
| `startWorker` (line 35) | None | Opens durable dependencies before the worker begins consuming queue messages. Direct named calls: `connectWorkerDatabase`, `startWorkerHealthServer`, `setInterval`, `runRetention`, `runStaleReminders`, `worker.on`, `process.on`, `console.log`. |
| `startWorker.runRetention` (line 47) | None | Deletes verification documents whose retention period has ended (runs once at startup too). Direct named calls: `runDocumentRetention`. |
| `startWorker.runStaleReminders` (line 52) | None | Reminds dealers about listings they have not confirmed for a while (runs once at startup too). Direct named calls: `runStaleListingReminders`. |
| `startWorker.shutdown` (line 73) | signal | Stops taking new jobs, gives running jobs until SHUTDOWN_TIMEOUT_MS to finish, then hands any still running back as pending (their progress checkpoints stay, so the next attempt resumes) and exits before the orchestrator's own kill deadline. Direct named calls: `console.log`, `setTimeout`, `hardExit.unref`, `clearInterval`, `Promise.race`, `worker.close`, `clearTimeout`, `releaseActiveLeases`, `console.warn`, `Promise.allSettled`, `inventoryQueueProducer.close`, `results.push`, `disconnectWorkerDatabase`, `disconnectWorkerRedis`, `process.exit`, `results.some`. |

---

**[apps/worker/vitest.config.ts](../apps/worker/vitest.config.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[packages/shared-contracts/src/dtos/index.ts](../packages/shared-contracts/src/dtos/index.ts)**

Type contracts; these describe values for TypeScript and are not database writes or runtime checks by themselves.

Exported declarations: `AuthUserDto`, `UpdateAuthProfileInput`, `DealerVerificationDocumentDto`, `DealerApplicationDto`, `CreateDealerApplicationInput`, `NotificationDto`, `ListingImageDto`, `ListingDto`, `CreateListingInput`, `UpdateListingInput`, `UpdateListingStatusInput`, `ReorderListingImagesInput`, `STALE_LISTING_DAYS`, `bulkListingActions`, `BulkListingAction`, `BULK_LISTING_MAX_IDS`, `BULK_PRICE_REDUCTION_MAX_PERCENT`, `BulkListingActionInput`, `BulkListingActionResult`, `DealerListingStatsDto`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[packages/shared-contracts/src/enums/index.ts](../packages/shared-contracts/src/enums/index.ts)**

Module entry point or re-export barrel; inspect exported symbols/import targets.

Exported declarations: `userRoles`, `UserRole`, `userStatuses`, `UserStatus`, `dealerApplicationStatuses`, `DealerApplicationStatus`, `notificationTypes`, `NotificationType`, `notificationChannels`, `NotificationChannel`, `notificationEmailStatuses`, `NotificationEmailStatus`, `listingStatuses`, `ListingStatus`, `fuelTypes`, `FuelType`, `engineRequiredFuelTypes`, `batteryRequiredFuelTypes`, `transmissionTypes`, `TransmissionType`, `vehicleCategories`, `VehicleCategory`, `vehicleConditions`, `VehicleCondition`, `carBodyTypes`, `CarBodyType`, `motorcycleTypes`, `MotorcycleType`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[packages/shared-contracts/src/index.ts](../packages/shared-contracts/src/index.ts)**

Module entry point or re-export barrel; inspect exported symbols/import targets.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[packages/shared-contracts/src/interfaces/index.ts](../packages/shared-contracts/src/interfaces/index.ts)**

Type contracts; these describe values for TypeScript and are not database writes or runtime checks by themselves.

Exported declarations: `PaginationMeta`, `ListResponseMeta`, `ApiSuccessResponse`, `ApiErrorResponse`, `ApiResponse`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[packages/shared-contracts/src/media/imageConstraints.ts](../packages/shared-contracts/src/media/imageConstraints.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `LISTING_IMAGE_ASPECT_RATIO`, `LISTING_IMAGE_ASPECT_RATIO_LABEL`, `LISTING_IMAGE_MIN_WIDTH_PX`, `LISTING_IMAGE_MIN_HEIGHT_PX`, `LISTING_IMAGE_ASPECT_RATIO_TOLERANCE`, `LISTING_IMAGE_MAX_INPUT_PIXELS`, `LISTING_IMAGE_MAX_DIMENSION_PX`, `LISTING_IMAGE_OUTPUT_QUALITY`, `LISTING_IMAGE_OBJECT_PREFIX`, `LISTING_IMAGE_THUMB_MAX_DIMENSION_PX`, `LISTING_IMAGE_THUMB_QUALITY`, `LISTING_IMAGE_THUMB_SUBPATH`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[packages/shared-contracts/src/queue/inventoryJobs.ts](../packages/shared-contracts/src/queue/inventoryJobs.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `INVENTORY_JOB_OPTIONS`, `inventoryBullJobId`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `csv` (line 14) | uploadJobId | No leading explanation comment; read the linked implementation. |
| `images` (line 15) | uploadJobId | No leading explanation comment; read the linked implementation. |

---

**[packages/shared-contracts/src/search/embedding.ts](../packages/shared-contracts/src/search/embedding.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `SEARCH_EMBEDDING_DIMENSIONS`, `createLocalSearchEmbedding`, `normalizeEmbeddingResponse`, `composeListingSearchText`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `hashToken` (line 3) | token | No leading explanation comment; read the linked implementation. Direct named calls: `character.charCodeAt`, `Math.imul`. |
| `normalize` (line 9) | values | No leading explanation comment; read the linked implementation. Direct named calls: `Math.sqrt`, `values.reduce`, `values.map`. |
| `createLocalSearchEmbedding` (line 15) | text | Provides an offline, model-compatible dimension fallback based on token features. Direct named calls: `text.toLocaleLowerCase`, `hashToken`, `normalize`. |
| `normalizeEmbeddingResponse` (line 26) | payload | HF feature extraction can return one vector or one vector per token; both become one normalized vector. Direct named calls: `Array.isArray`, `payload.every`, `normalize`, `rows.some`, `Array.from`. |
| `composeListingSearchText` (line 38) | listing | No leading explanation comment; read the linked implementation. Direct named calls: `Object.values`. |

---

**[packages/shared-contracts/src/utils/mongoUri.ts](../packages/shared-contracts/src/utils/mongoUri.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `findProductionMongoUriProblems`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `findProductionMongoUriProblems` (line 8) | uri | Lists the reasons a MongoDB URI is unsafe for production, so a production deployment cannot silently run against a local, dev, or test database or over an unencrypted connection. Returns an empty array when the URI is acceptable. Direct named calls: `MONGO_URI_PATTERN.exec`, `uri.trim`, `params.get`, `scheme.toLowerCase`, `problems.push`, `hostList.split`, `decodeURIComponent`, `NON_PRODUCTION_DB_PATTERN.test`. |

---

**[packages/shared-contracts/src/utils/registrationNumber.ts](../packages/shared-contracts/src/utils/registrationNumber.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `normalizeRegistrationNumber`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `normalizeRegistrationNumber` (line 3) | value | Normalizes a vehicle registration/license plate number into a comparable identity key. "CAX-1234", "CAX 1234", and "cax1234" all normalize to "CAX1234". Direct named calls: `value.trim`. |

---

**[packages/shared-contracts/src/vehicle/attributeSchemas.ts](../packages/shared-contracts/src/vehicle/attributeSchemas.ts)**

Validation rules and related types; these reject or normalize unsupported input.

Exported declarations: `carAttributesSchema`, `motorcycleAttributesSchema`, `vanAttributesSchema`, `truckAttributesSchema`, `threeWheelerAttributesSchema`, `busAttributesSchema`, `otherVehicleAttributesSchema`, `vehicleDetailsSchema`, `CarAttributesInput`, `MotorcycleAttributesInput`, `VanAttributesInput`, `TruckAttributesInput`, `ThreeWheelerAttributesInput`, `BusAttributesInput`, `VehicleDetailsInput`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `refinePowertrain` (line 25) | data, ctx | Requires engineCapacityCc for combustion-bearing fuel types and both battery fields for battery-bearing fuel types (conventional hybrid is combustion-required but battery-optional). Direct named calls: `ctx.addIssue`. |

---

**[packages/shared-contracts/src/vehicle/csvTemplates.ts](../packages/shared-contracts/src/vehicle/csvTemplates.ts)**

Supporting application module; use the symbols, comments, and direct calls below to follow its role.

Exported declarations: `CsvFieldDescriptor`, `CategoryCsvTemplate`, `carCsvTemplate`, `motorcycleCsvTemplate`, `vanCsvTemplate`, `truckCsvTemplate`, `threeWheelerCsvTemplate`, `busCsvTemplate`, `csvTemplatesByCategory`, `buildCsvTemplateContent`.

| Function/component | Parameters | Explanation and direct calls |
| --- | --- | --- |
| `buildCsvTemplateContent` (line 98) | template | Renders a template's field list + example rows into an actual downloadable CSV file body. Direct named calls: `template.fields.map`, `headers.join`, `template.exampleRows.map`, `lines.join`. |
| `buildCsvTemplateContent.escape` (line 100) | value | No leading explanation comment; read the linked implementation. Direct named calls: `value.replace`. |

---

**[packages/shared-contracts/src/vehicle/index.ts](../packages/shared-contracts/src/vehicle/index.ts)**

Module entry point or re-export barrel; inspect exported symbols/import targets.

Exported declarations: `PowertrainAttributes`, `CarAttributes`, `MotorcycleAttributes`, `VanAttributes`, `TruckAttributes`, `ThreeWheelerAttributes`, `BusAttributes`, `OtherVehicleAttributes`, `VehicleDetails`, `VehicleAttributesByCategory`, `AnyVehicleAttributes`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.

---

**[packages/shared-contracts/src/vehicle/listingSchemas.ts](../packages/shared-contracts/src/vehicle/listingSchemas.ts)**

Validation rules and related types; these reject or normalize unsupported input.

Exported declarations: `commonListingFieldsSchema`, `listingRowSchema`, `ListingRowInput`.

No named function declarations: this file contains configuration, types, data, re-exports, top-level setup, or anonymous callbacks.
