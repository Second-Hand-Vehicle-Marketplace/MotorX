# MotorX improvement roadmap

Review date: 2026-09-21.

MotorX has the core of a usable dealer inventory and vehicle discovery system. The next milestone should make existing workflows complete and reliable, then add buyer engagement features.

This is a repository review of documentation, requirements text, application architecture, core frontend/backend/worker flows, shared contracts, tests, Docker configuration, and CI/CD. Findings below distinguish observed implementation gaps from proposed product extensions. It is not a line-by-line audit of every asset, a penetration test, or proof of production configuration. Generated report assets and PDF diagrams were not exhaustively inspected. No application code or live data was changed, and the full test suite was not run.

## Current system

- React/TypeScript frontend with buyer, dealer, and administrator portals.
- Firebase identity verification with local MongoDB roles and account status.
- Express modular backend with ownership checks and shared Zod vehicle validation.
- Dealer applications with protected verification documents and transactional approval.
- Manual listings, category-specific CSV imports, rejected-row reporting, ZIP photo attachment, and listing status transitions.
- Public structured browsing and hybrid search with natural-language parsing and lexical fallback.
- Administrator moderation, audit records, and in-app/email notifications.
- Separate BullMQ worker, MongoDB Atlas, Redis, S3-compatible storage, Docker, and GitHub CI/CD definitions.

Keep the modular monolith and separate worker. They fit the project and its small team. Shared validation, scoped repository queries, transactional dealer approval, bounded CSV batches, and search fallback are useful foundations to retain.

## Priority 0: protect data and repair failure handling

### 1. Isolate destructive database tests

Evidence: [test/db.ts](../apps/backend/src/test/db.ts) imports dotenv, uses `MONGODB_URI`, and clears every registered collection with `deleteMany({})`. Repository tests call that cleanup after tests. [vitest.config.ts](../apps/backend/vitest.config.ts) does not force a dedicated database.

If the effective environment points at the development or production database, these tests can delete application data. CI explicitly supplies a test URI, but the local helper itself has no safety boundary.

Build: require a separate `TEST_MONGODB_URI`, validate an explicitly allowed disposable database before connecting or deleting, and isolate test runs. Repair `compose.test.yml`: its MongoDB override lacks an image/build after MongoDB was removed from the base Compose file. Use a replica set for tests that exercise transactions.

Acceptance: a non-test target is refused before any mutation; repository and transaction tests run against disposable infrastructure.

### 2. Make ETL retries and restart recovery work

Evidence: [queue.ts](../apps/backend/src/config/queue.ts) configures three attempts, but [uploadJob.repository.ts](../apps/worker/src/repositories/uploadJob.repository.ts) only claims `pending` jobs. [uploadJob.service.ts](../apps/worker/src/services/uploadJob.service.ts) changes errors to `failed`. A worker crash can leave `processing` behind. Neither state can be reclaimed by the current claim function. Image jobs follow the same pattern.

Build: explicit retryable versus terminal failures, attempt/lease ownership, abandoned-job recovery, and durable row identity such as upload ID plus row number. Persist rows and progress so replay can resume without duplicating completed work. Add a reconciliation process for MongoDB jobs that were created but never successfully published to Redis.

Acceptance: interrupt an import after one persisted batch; retry finishes with correct counts and no duplicate listings. A temporary storage error recovers automatically. Completed jobs remain completed when delivered again.

BullMQ's [idempotent job guidance](https://docs.bullmq.io/patterns/idempotent-jobs) explains why queue retry configuration alone cannot guarantee safe replay.

### 3. Enforce duplicate prevention atomically

Evidence: [listing.service.ts](../apps/backend/src/modules/marketplace/listing.service.ts) checks registration availability before inserting, while [listing.model.ts](../apps/backend/src/modules/marketplace/listing.model.ts) deliberately has a non-unique registration index. Worker imports also check before inserting.

Two concurrent imports or a manual create and an import can both pass the check. Sold/archived reuse is legitimate, but does not require leaving active inventory unconstrained.

Build: a database constraint limited to the statuses that reserve a registration, or an atomic registration-reservation collection. Handle conflicts as row rejections or HTTP 409, and inspect existing duplicates before migrating. MongoDB supports [unique constraints on partial indexes](https://www.mongodb.com/docs/v8.0/core/index-partial/).

Acceptance: concurrent submissions for the same normalized plate create at most one draft/active listing; legitimate sold/archived reuse still works.

### 4. Bound and validate ZIP processing

Evidence: [imageProcessing.service.ts](../apps/worker/src/services/imageProcessing.service.ts) buffers the archive, fully expands each entry before checking its size, and retains extracted buffers in a map. Image MIME type comes from the filename extension. [inventory.repository.ts](../apps/backend/src/modules/inventory/inventory.repository.ts) permits another ZIP submission without guarding current image-processing state; the queue reuses a fixed image-job ID.

Build: enforce streamed per-entry and total expanded-byte budgets, entry limits, actual image validation, and atomic per-listing capacity checks. Reject conflicting submissions or assign a distinct durable attempt ID. Reconcile storage objects when an upload succeeds but metadata persistence fails.

Acceptance: oversized expansion stops within the memory budget; renamed non-images are rejected; simultaneous photo operations cannot exceed the image limit; a second ZIP is either clearly rejected or processed exactly as intended.

## Priority 1: finish the existing product

### 5. Complete dealer listing management

Evidence: [App.tsx](../apps/frontend/src/app/App.tsx) has a create-listing route but no edit route. [ListingManager.tsx](../apps/frontend/src/portals/dealer/pages/ListingManager.tsx) provides status actions but no edit action, and links every listing to a public detail endpoint that only accepts active listings.

Build: an owned listing detail/preview endpoint and page, listing edit form, existing-image remove/replace/reorder controls, and useful mutation errors. Preserve the newly created listing ID if a later image upload fails, allowing image retry without creating the listing again.

Also fix an existing backend defect: `updateDealerListing` skips `description` when building its update, so a new non-null description is not saved. Its embedding calculation consequently uses the old description. Compute embeddings from the final merged listing state.

Acceptance: dealers can preview drafts, edit descriptions/prices/specifications, and manage images after creation. An interrupted image upload is recoverable. This closes gaps around FR-DEALER-08, FR-MARKET-04, and FR-MARKET-15.

### 6. Remove the 100-listing ceiling

Evidence: both [DealerDashboard.tsx](../apps/frontend/src/portals/dealer/pages/DealerDashboard.tsx) and the listing manager request only `getMyListings(1, 100)`. Dashboard totals and inventory filters are calculated from that page. The owned-listing repository only receives page and limit.

Build: server-side dealer search/status/category filters and pagination, plus a dedicated aggregation endpoint for totals.

Acceptance: a dealer with 250 listings can access all 250 and sees accurate totals for each status, independent of the selected page.

### 7. Complete dealer profile and application lifecycle

Evidence: [dealer.routes.ts](../apps/backend/src/modules/dealers/dealer.routes.ts) only exposes application submission and current application retrieval. [dealer.service.ts](../apps/backend/src/modules/dealers/dealer.service.ts) rejects a second application whenever any application already exists. The frontend's dealer registration flow creates a new Firebase account.

Build: approved-dealer profile editing, an application path for existing buyers, controlled correction/resubmission after rejection, and administrator views of approved/rejected dealers as well as pending applications.

Acceptance: dealers update public contact information; existing buyers apply without registering again; rejected applicants correct the stated problems while preserving review history. Profile editing is already required by FR-DEALER-03.

### 8. Make health checks and diagnostics truthful

Evidence: [app.ts](../apps/backend/src/app.ts) always reports readiness as `READY`; [admin.service.ts](../apps/backend/src/modules/admin/admin.service.ts) reports queue and worker as `not_configured` despite their implementation. [logger.ts](../apps/backend/src/config/logger.ts) is a placeholder, and unexpected errors are not logged by the global error handler.

Build: dependency-aware readiness with timeouts, worker heartbeat freshness, queue lag/failure metrics, structured request/job logs, correlation IDs, and startup error context. Keep process liveness separate from dependency readiness. Define which dependency failures block all traffic versus only a specific capability. Keep infrastructure diagnostics in protected developer/support tooling; the business administrator experience should follow item 15 below.

Acceptance: a disconnected database changes readiness to an appropriate failure response; technical operators can distinguish a dead worker from an empty queue; an unexpected API error is traceable without logging credentials. Business administrators see the affected capability and next action in plain language. This addresses RR-10 and the administration health requirements without exposing infrastructure details in the admin portal.

### 9. Improve search retrieval and measure relevance

Evidence: [search.repository.ts](../apps/backend/src/modules/search/search.repository.ts) selects the newest 300 structured matches for lexical scoring, without selecting them by query relevance. [search.service.ts](../apps/backend/src/modules/search/search.service.ts) retains zero-score candidates. Older relevant inventory can be omitted during fallback, and unrelated inventory can be returned. Changing away from relevance sorting can also discard residual text intent when structured constraints were extracted.

Build: query-aware lexical candidate retrieval, evaluated relevance thresholds, explicit semantics for truncated result counts, and equivalent matching across sort modes. Store embedding model/version and source-text hash, and regenerate embeddings asynchronously with observable failures.

Acceptance: older exact matches are found in a dataset larger than the candidate cap; irrelevant queries produce useful empty states; sorting preserves query meaning. Evaluate representative Sri Lankan vehicle queries using judged relevance, latency, fallback frequency, and zero-result rate. Treat Sinhala/Tamil query support as a later extension.

## Priority 1: quality and operational readiness

### 10. Test complete workflows

Evidence: [frontend/package.json](../apps/frontend/package.json) has a placeholder test command. Existing backend tests mostly cover validation and repositories; worker service tests mock durable dependencies. CI runs backend/worker tests but has no browser journey coverage.

Build targeted integration and browser tests for buyer registration, dealer application/approval, ownership rejection, listing edits, upload retry, image recovery, suspension, and search fallback. Test database races and transactions against actual isolated services. Benchmark the SRS targets, including 5,000 imported records in the defined two-minute test environment; configuration alone does not prove those targets.

### 11. Decouple notifications and preserve audit consistency

Evidence: dealer review is transactional, but account status changes and listing archival precede separate audit writes in [admin.service.ts](../apps/backend/src/modules/admin/admin.service.ts). Notification creation/email delivery is awaited after business updates. Notification persistence failure can surface after the operation already succeeded; worker notification failures can enter the import failure handler after completion.

Build: transactional audit writes for significant mutations and a durable notification outbox with retry, event deduplication, and delivery error metadata. SMTP failures already record a failed state; add actual recovery rather than replacing that existing behavior.

Acceptance: notification failure cannot reverse a completed import or make a committed review appear unsuccessful; every committed administrative mutation has its audit event.

### 12. Add application abuse controls and clarify account behavior

Evidence: no application rate limiter is mounted in `app.ts`; public search can invoke an external embedding service; uploads buffer files in memory. Local-user synchronization requires an email value but does not check `email_verified`. Deployment-level controls were not inspected.

Build: explicit request/concurrency budgets for search and uploads, a documented email-verification policy, verified file contents for dealer documents, and a defined policy for public listings owned by suspended dealers. Public browsing currently filters listing status rather than seller account status.

Also clear user-scoped query caches on logout/account change and preserve useful HTTP status information in client errors. Review these with multi-account browser tests.

### 13. Make releases reproducible and recoverable

Evidence: backend/worker Dockerfiles use `npm install` without copying the lockfile, whereas CI uses `npm ci`. Thus image dependency resolution can differ from the tested installation. They also retain development dependencies and have no explicit non-root runtime user. The deployment workflow allows a manual main-branch deployment without checking that CI passed for that exact SHA.

Build: locked dependency installation in every image, smaller production stages, explicit runtime users, and a tested-commit gate for manual releases. Add staging smoke tests, backup/restore drills, and a coordinated release recovery procedure. The CD guide already describes ECS circuit-breaker rollback; verify the actual configuration rather than assuming it is absent or enabled.

### 14. Repair documentation drift

Evidence:

- `team-work-plan.md` says the repository is scaffold-only.
- `docs/database.md` says notifications are unimplemented.
- `docs/admin-fr-traceability.md` describes ETL as missing and contradicts itself about audit completion.
- `docs/frontend-backend-endpoint-map.md` retains mock-auth instructions and obsolete endpoint paths.
- `docs/api-contract.md` mixes implemented routes with obsolete image/admin paths and a `/health` route that is not mounted.
- The README developer-setup link points into `docs`, while the file lives at the root.
- `docs/architecture.md` contains only a brief architecture statement.

Build: a current architecture overview, authoritative route/schema documentation, and a requirement-to-implementation-to-test matrix. Mark historical build guides as historical. Add CI checks for documentation links and API examples.

### 15. Redesign the admin dashboard around business decisions

Priority: 1, alongside completion of the existing dealer workflows. User direction: administrators need marketplace activity, review tasks, and actionable problems; MongoDB, Redis, backend uptime, and technical system-health details do not belong in their everyday dashboard.

Evidence: [AdminDashboard.tsx](../apps/frontend/src/portals/admin/pages/AdminDashboard.tsx) links to System Health and still shows an Upload Jobs placeholder saying the upload pipeline is unavailable. [SystemHealth.tsx](../apps/frontend/src/portals/admin/pages/SystemHealth.tsx) exposes Backend API, MongoDB Database, Redis Queue, ETL Worker, raw service statuses, and uptime. [AdminLayout.tsx](../apps/frontend/src/portals/admin/layout/AdminLayout.tsx) makes technical System Health a standard navigation item.

Build the dashboard in this order:

| Area | Show | Action supported |
|---|---|---|
| Needs attention | Pending dealer applications with waiting time; failed inventory uploads; uploads with rejected records | Open the exact application or upload to review it |
| Marketplace overview | Active dealers, registered users, active listings, and pending applications | Open the relevant filtered management list |
| Inventory activity | Recent uploads with dealer name, file name, submitted time, understandable status, accepted/rejected counts | Inspect affected records and help the dealer resolve the issue |
| Recent administrative activity | Dealer approvals/rejections, account suspensions/reactivations, listing removals, actor and time | Open the related record or activity history |
| Service interruption notice, when relevant | Business impact such as “Inventory uploads are delayed,” last checked time, and a support action | Understand the affected workflow and escalate appropriately |

Use distinct definitions for active versus total listings and approved versus active dealers. Fetch platform-wide counts from the backend rather than calculating them from one page. Provide date filters for activity and clearly label the selected period. Add reported-listing counts only when the reporting feature exists, and enquiry metrics only after enquiries are implemented.

Navigation and language changes:

- Remove the technical System Health shortcut and sidebar item from the standard admin portal. Retain infrastructure monitoring in separately protected developer/support tooling; hiding a link alone is not access control.
- Organize navigation around Dashboard, User Accounts, Dealers, Listings, Inventory Uploads, and Activity History. The Dealers view should include approval requests and existing dealer accounts.
- Present audit information as readable business actions while retaining the underlying audit trail.
- Replace implementation language such as “MongoDB,” “ETL,” “Redis,” “API,” “queue,” and raw error codes in normal screens with task-specific explanations. For example, show “Processing inventory” or “Upload needs attention.”
- Use accurate, actionable interruption messages only when supported by monitoring. Do not claim that support has been notified or show a recovery estimate unless that is known.
- Remove obsolete development placeholders. Distinguish loading, unavailable data, and an actual zero count. Preserve successfully loaded sections if another section fails.

Acceptance: an administrator can identify pending work, review an application, investigate an unsuccessful upload, and understand recent moderation without technical knowledge. Every summary links to the correct filtered list or record. No infrastructure names, connection states, or uptime counters appear in standard admin pages. Service problems describe user impact and a next action. Dashboard values come from real data and include clear empty/error states.

Update the administration requirement traceability to distinguish business-facing service availability from technical diagnostics. Apply this redesign to the dashboard and related admin screens, not just the home-page cards.

## New product capabilities, after the existing gaps

These are proposed extensions, not claims that the SRS currently requires them.

| Order | Capability | Small useful first version | Value |
|---|---|---|---|
| 1 | Buyer enquiries and dealer lead inbox | Enquiry tied to buyer, listing, and dealer; contact preference; new/contacted/closed states; notification | Gives MotorX a measurable path from vehicle discovery to a sales conversation |
| 2 | Saved vehicles and comparison | Persistent shortlist and category-aware comparison of 2–3 vehicles | Helps buyers return and make a decision |
| 3 | Dealer storefronts | Public dealer profile and that dealer's active inventory | Makes approved dealers easier to assess and contact |
| 4 | Listing reports and moderation reasons | Report reason, administrator review queue, resolution history | Gives buyers a way to flag misleading or unavailable vehicles |
| 5 | Inventory quality tools | Bulk publish/archive, downloadable rejected-row correction file, freshness reminders | Reduces repetitive dealer work and stale inventory |
| 6 | Saved searches and alerts | Saved filters, matching-listing alerts, preferences and unsubscribe | Encourages repeat use after notification delivery is reliable |
| 7 | Dealer analytics | Listing views, contact clicks, enquiries, response time, sold conversion | Shows dealers which inventory and actions generate results |

The buyer detail page currently provides phone/email contact links; enquiries would add tracking and follow-up rather than introduce contact from scratch. Add event collection before promising analytics. Assess mobile layouts, keyboard operation, and category-specific specifications while extending these screens.

## Recommended delivery order

| Milestone | Deliverables | Exit evidence |
|---|---|---|
| A: Data safety and recovery | Test isolation, safe retries, atomic duplicates, bounded ZIP processing | Destructive-test guard and crash/concurrency tests pass |
| B: Complete dealer and admin workflows | Edit/preview/images, accurate totals/pagination, profile editing, application correction, business-focused admin dashboard and navigation | A dealer manages an inventory larger than 100 entries; an administrator can act on reviews and upload problems without technical knowledge |
| C: Reliable operation | Protected technical diagnostics, plain-language service-impact notices, logs, notification outbox, audit consistency, locked images, journey tests | Operators can diagnose failures; administrators understand business impact; recovery preserves business state |
| D: Better discovery and conversion | Search evaluation/fixes, enquiries, shortlist/comparison | Representative queries retrieve relevant inventory and dealers can follow up on enquiries |

Update documentation within every milestone. Keep new product features separate from mandatory requirement completion when planning the academic demonstration or release.
