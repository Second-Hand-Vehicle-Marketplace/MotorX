# MotorX — Master Test Plan and Test Evaluation Report

Version 2.0 • Group 23 • 26 September 2026

## Document control

| Item | Value |
| --- | --- |
| Project | MotorX — Second-Hand Vehicle Marketplace with Intelligent Search and Automated Inventory Processing |
| Document | Master Test Plan and Test Evaluation Report |
| Version / date | 2.0 / 26 September 2026 |
| Prepared for | Group 23 — final submission |
| Baseline | ffac7f9d5dfc7112ff82cd482f37030bf7874344 (merge of origin/main (aafca89, version4) into dewni2 (48c99be), conflicts resolved and retested; commit the merge with this report) |
| Status | 291 automated unit, integration and system tests executed and passed; live-stack smoke executed; browser end-to-end journeys specified for manual execution by the team. |
| Template | 6 Template for Test plan.docx (Rational Unified Process). Its six main sections and eight technique categories are kept; Sections 3.2–3.8 add the MotorX test cases by level. |
| Approval | Project team / supervisor review pending; no approval is implied by this report. |

## Revision History

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 21 Sep 2026 | 1.0 | Initial MotorX plan, case register and 77-test automated baseline; integration and end-to-end work planned. | Group 23 |
| 26 Sep 2026 | 2.0 | Re-executed all suites (291 tests, all passing) on Node 24 against a real MongoDB replica set, Redis and MinIO. Added HTTP journey integration tests, frontend component tests, the 5,000-record benchmark, the worker crash drill and a live-stack smoke test. Covered new features: mobile layouts, Sinhala/Tamil, similar vehicles, recommendations, compare, stale-stock tools, bulk actions and small photo copies. Merged main (version4) and retested: 291 tests passing. Updated findings, coverage and risks. | Group 23 |

## Table of Contents

1. Evaluation Mission and Test Motivation

2. Target Test Items

3. Test Approach

3.1 Testing Techniques and Types

3.2 Unit and Component Testing

3.3 Integration Testing

3.4 End-to-End Testing

3.5 Non-functional Test Cases

3.6 Environment, Data and Execution

3.7 Entry, Exit and Suspension Criteria

3.8 Responsibilities and Schedule

4. Deliverables

4.1 Test Evaluation Summaries

4.2 Reporting on Test Coverage

5. Risks, Dependencies, Assumptions, and Constraints

6. References

Navigation: section headings appear in Word’s Navigation Pane. The contents list deliberately omits page numbers so it stays valid after editing.

## 1. Evaluation Mission and Test Motivation

MotorX connects buyers with dealer-owned second-hand vehicles and removes manual inventory entry through category-specific CSV imports, background processing and ZIP photo attachment. A React/TypeScript interface (with English, Sinhala and Tamil text) calls an Express modular backend; a separate worker processes BullMQ jobs, sends queued emails and runs scheduled maintenance. MongoDB stores application records, Redis backs the queue and rate limits, S3-compatible storage holds files, and Firebase provides authentication. Search combines structured filters with lexical and semantic ranking. [1]–[3]

Mission: establish, with evidence, whether the submission build supports the essential buyer, dealer and administrator journeys; keeps each dealer’s data private; never loses or duplicates inventory, including when a worker crashes mid-import; and meets the measurable SRS targets. Testing concentrates on the failures that matter most for a marketplace: unauthorized access, lost or duplicated listings, incorrect search results, stale stock shown as available, and visible failures during the demonstration.

This version is both the test plan and the evaluation report for the submission build. 291 automated tests were executed for it and all passed (backend 147, worker 94, frontend 50). A read-only smoke test also ran against the live application and real data. Browser journeys are fully specified in Section 3.4 but, at the time of writing, have not been executed by a person; they are reported as not executed, never as passed. A planned case is not a passed test.

Source priority: the SRS defines required behavior; the source code at the baseline commit is the implementation under test; the supplied Word template defines the report structure. Features beyond the SRS (mobile layouts, languages, recommendations, compare, stale-stock and bulk tools) are labelled “Extension” and tested to the same standard. Differences between the SRS and the implementation are recorded as findings instead of redefining expected results.

## 2. Target Test Items

| Target | Scope and interfaces | Priority |
| --- | --- | --- |
| Authentication and users | Firebase sign-in, token verification and cache, local profile, buyer/dealer/admin roles, suspension, email verification before approval, per-account cache clearing. | Critical |
| Dealer management | Application with documents (content-checked), pending/approved/rejected states, resubmission after rejection, approval audit, public profile editing, document retention. | High |
| Marketplace | Category-aware create/edit, lifecycle (draft/active/sold/archived), photo upload with re-encoding and small copies, buyer details, suspended-dealer hiding. | Critical |
| Inventory and ETL | CSV templates, upload acceptance when Redis is down, BullMQ, validation, normalization, duplicates, rejected rows, counters, leases, checkpoints, retries, reaper, ZIP photos. | Critical |
| Dealer inventory tools (Extension) | Bulk publish / mark sold / archive / confirm / reduce price / delete; publish all drafts of one upload; stale-stock list, counts and weekly reminder. | High |
| Search and discovery | Filters, natural-language extraction, typo correction, ranking, fallback; similar vehicles, recommendations from recently viewed vehicles, side-by-side compare (Extension). | High |
| Administration and notifications | Review, moderation, account status, audit with date filters, dashboard, upload monitoring, scoped inbox, email outbox with retries. | High |
| Frontend experience (Extension) | Responsive layouts and mobile navigation, filter sheet, swipe gallery, contact bar with WhatsApp, card tables on phones, Sinhala/Tamil switching. | High |
| Security controls | Rate limits and upload concurrency gate, document and image sanitization, storage prefix isolation, secrets scanning and image vulnerability scanning in CI. | High |
| Deployment and dependencies | Workspace builds on Node 24, Docker images, Compose (dev and isolated test project), MongoDB replica set, Redis, MinIO, health endpoints, CI pipeline. | High |
| Client environments | Desktop and mobile/tablet widths in Chrome/Edge/Firefox; Safari where a device is available. | Medium |

Outside this campaign: payments, financing and chat (not implemented); penetration testing of Firebase, Atlas and AWS themselves; physical hardware failure; proof of monthly availability from short test runs; production CloudFront configuration. Missing SRS behavior stays visible as a finding, not an exclusion.

## 3. Test Approach

Testing runs bottom-up: fast unit and component tests on every change; integration tests against real MongoDB, Redis and object storage; HTTP journey tests that drive the real Express application and database end to end; system-level drills and a smoke test on running stacks; and finally browser journeys performed by a person. Techniques used: equivalence partitioning, boundary values, negative inputs, state-transition testing, two-dealer ownership checks, fault injection (killed worker, Redis down, storage errors) and before/after database inspection. A 200 response alone never counts as a pass; each case checks the persisted state or the visible result.

| Level | What it crosses | Tests | Result |
| --- | --- | --- | --- |
| Unit / component | One function, schema, service or React component; databases, queues, storage and network replaced by fakes (jsdom for the frontend). | 234 in 41 files | Executed: 234/234 passed |
| Integration — data | Repository, service and migration code against a real MongoDB 7 replica set; rate limits against real Redis. | 24 in 8 files | Executed: 24/24 passed |
| Integration — HTTP journeys | Real Express app, middleware, services and MongoDB through HTTP (supertest). Only Firebase token checks and S3 calls are replaced, because they are external services. | 32 in 3 files | Executed: 32/32 passed |
| Performance | Real CSV pipeline, MongoDB and MinIO with 5,000 rows. | 1 | Executed: passed (11.2 s) |
| End-to-end — system | Running containers: worker crash drill (60,000 rows) and read-only smoke of the live dev stack with real data. | 2 procedures | Executed: drill passed; smoke 16 passed, 1 failed (F-01) |
| End-to-end — browser | A person using the real frontend, Firebase, backend, worker and storage. | 15 journeys | Specified; not executed at the time of writing |

Test doubles are used deliberately and stated per case. The HTTP journey tests replace the Firebase Admin SDK (token verification) and the S3 client, so they prove the application’s own authorization, validation and database behavior, not Firebase or AWS themselves; those are covered by the live smoke test and the browser journeys. The worker test named “end to end” in transform.test.ts checks one batch transformation locally and is counted as a unit test.

### 3.1 Testing Techniques and Types

#### 3.1.1 Data and Database Integrity Testing

| Template field | MotorX application |
| --- | --- |
| Technique Objective | Keep listings, ownership, upload lineage, counters and duplicate rules correct, including under retries, crashes and concurrent requests. |
| Technique | Real MongoDB replica set: repository tests; lease and idempotency tests (jobSafety.db); HTTP journeys that inspect documents after each request; the 60,000-row crash drill; the unique partial index on normalized registration numbers. |
| Oracles | Exact document counts, one listing per CSV row, one rejected record per bad row, unchanged foreign documents, audit rows written in the same transaction as the change. |
| Required Tools | Vitest, Mongoose, supertest, MongoDB 7 replica set (compose project motorx-test), mongosh for inspection. |
| Success Criteria | Achieved: all 24 data-integration tests and 32 journeys pass; the crash drill finished with 60,000 listings from 60,000 distinct rows and no duplicates. |
| Special Considerations | Tests refuse to run unless TEST_MONGODB_URI names a motorx_test database on a local host (db.safety tests). Run with --maxWorkers=1 because suites clear shared collections. |

#### 3.1.2 Function Testing

| Template field | MotorX application |
| --- | --- |
| Technique Objective | Verify buyer, dealer and administrator business rules with valid, invalid and boundary inputs. |
| Technique | Unit tests for rules and schemas; HTTP journeys for complete use cases (apply → reject → resubmit → approve; bulk publish; stale detection; similar/recommended vehicles); browser journeys for the user’s view. |
| Oracles | SRS requirements, shared Zod schemas, status codes and error format, final database state, visible messages. |
| Required Tools | Vitest, supertest, Testing Library; manual browser execution (Playwright proposed for later automation [5]). |
| Success Criteria | Achieved for automated levels (all pass). Browser journeys pending manual execution. |
| Special Considerations | An implemented behavior is never marked as meeting an SRS clause it does not cover; gaps are listed in Section 4.1. |

#### 3.1.3 User Interface Testing

| Template field | MotorX application |
| --- | --- |
| Technique Objective | Verify navigation, accessible forms and usable layouts on phones, tablets and desktops, in English, Sinhala and Tamil. |
| Technique | Component tests in jsdom (drawer menu, focus handling, card tables, swipe gallery, contact bar, compare, language switching, listing manager); manual checks at 360, 390, 768 and 1440 px with keyboard only; Lighthouse mobile audit. |
| Oracles | Menu reachable at every width; focus moves into and out of drawers and dialogs; labels on all fields; 16 px inputs on phones; 44 px touch targets; no horizontal page scroll; every English message has a Sinhala and a Tamil translation with the same placeholders. |
| Required Tools | Vitest + Testing Library + jsdom; Chrome DevTools device mode; Lighthouse; physical phone where available. |
| Success Criteria | Achieved for component tests (50/50). Visual checks, Lighthouse scores and native-speaker review of translations pending. |
| Special Considerations | jsdom does not render CSS, so layout at each width must be confirmed in a real browser (E2E-12). Device emulation is not proof of physical-device behavior. |

#### 3.1.4 Performance Profiling

| Template field | MotorX application |
| --- | --- |
| Technique Objective | Measure API/search latency and ETL throughput against PSR-01–06. |
| Technique | Benchmark: import 5,000 generated rows through the real pipeline and time it. Smoke test: record response times of key endpoints on the live stack. Planned: k6 run with percentiles. |
| Oracles | PSR-01: 95% of normal requests within 2 s. PSR-02: structured search within 2 s. PSR-03: semantic search normally within 5 s. PSR-05: about 5,000 records within 2 minutes. |
| Required Tools | Vitest benchmark (RUN_BENCHMARKS=1), smoke script timings, container metrics; k6 proposed. |
| Success Criteria | PSR-05 met: 5,000 records in 11.1–11.2 s (≈450 records/s) in two consecutive runs. Smoke timings (single requests, 3–868 ms) are indicative only, not a percentile measurement. |
| Special Considerations | Record hardware, dataset and embedding mode with each result. Local numbers do not predict Atlas or AWS latency. |

#### 3.1.5 Load Testing

| Template field | MotorX application |
| --- | --- |
| Technique Objective | Verify the system stays responsive with many buyers browsing while imports run. |
| Technique | Planned: 5, 20 then 50 concurrent virtual users for 10 minutes each after a 2-minute warm-up; mix 70% browse, 20% search, 10% details; one 5,000-row import running alongside. |
| Oracles | Latency percentiles, error rate, queue depth, memory, final record counts. |
| Required Tools | k6 (proposed), container metrics. |
| Success Criteria | Not executed. Proposed target: SRS latency at the agreed normal-load stage and under 1% server errors. |
| Special Considerations | Run only on an isolated stack; rate limits must be raised or the load generator allow-listed, otherwise the test measures the limiter. |

#### 3.1.6 Security and Access Control Testing

| Template field | MotorX application |
| --- | --- |
| Technique Objective | Verify authentication, roles, ownership, input handling and protection of private files. |
| Technique | HTTP journeys with a second dealer changing IDs, wrong roles, missing tokens and suspended accounts; unit tests for token caching and revocation, document sanitization (PDF scripts, launch actions, embedded files, renamed executables), image re-encoding (EXIF/GPS removal, pixel cap, hidden data), rate limits and upload concurrency; CI secret scanning (Gitleaks) and image scanning (Trivy); npm audit. |
| Oracles | 401 without a valid token; 403 for the wrong role or a suspended account; 404 for another dealer’s resources with no change made; private storage objects never served publicly; 429 when limits are exceeded. |
| Required Tools | supertest, Vitest, Gitleaks, Trivy, npm audit. |
| Success Criteria | Achieved for all automated cases (10 access-control journeys plus security unit tests pass). Smoke test confirmed 401 on dealer and admin routes of the live stack. |
| Special Considerations | Firebase verification itself is replaced in journeys; the live smoke and browser journeys cover real tokens. No external penetration test was performed. |

#### 3.1.7 Failover and Recovery Testing

| Template field | MotorX application |
| --- | --- |
| Technique Objective | Verify recovery from a crashed worker, Redis outage, storage errors and email failures without losing or duplicating work. |
| Technique | Crash drill: kill the worker mid-import of 60,000 rows and let a second worker take over. Unit/integration: lease takeover, checkpoint resume, reaper re-queuing lost jobs, uploads accepted while Redis is down, transient-error retries, email outbox retries. |
| Oracles | Final listing count equals distinct source rows; no job left pending forever; retries follow the configured backoff; failed emails keep the in-app notification. |
| Required Tools | scripts/drills/kill-worker-mid-import.sh, Docker, Vitest. |
| Success Criteria | Achieved: drill recovered in 4 min 43 s with no duplicates; all recovery tests pass. |
| Special Considerations | No redundant production deployment is tested; this is restart and recovery, not automatic infrastructure failover. Never run drills against the shared dev stack. |

#### 3.1.8 Configuration Testing

| Template field | MotorX application |
| --- | --- |
| Technique Objective | Verify reproducible builds and correct behavior across the documented configurations. |
| Technique | Build all workspaces; run tests on Node 24 in containers; production-URI guard tests; start the dev stack and run the smoke test; CI pipeline on push. |
| Oracles | Build exit code 0; health and readiness 200; frontend routes serve the app shell; stored URLs reachable. |
| Required Tools | npm workspaces, TypeScript, Vite, Docker Compose, GitHub Actions. |
| Success Criteria | Build passed; tests pass on Node 24.21.0; smoke passed except photos on 22 active listings, whose files only existed on an old server (finding F-01). |
| Special Considerations | Stored absolute photo URLs depend on S3_PUBLIC_URL at upload time; see F-01. Browser matrix still to be recorded. |

### 3.2 Unit and Component Testing

Each case below is one test file; its individual tests are listed with their outcomes in test-evidence/automated-test-register.csv. These tests need no running services: databases, queues, storage, Firebase and the network are replaced, and frontend components render in jsdom. They run in seconds and are the first gate in CI.

#### UT-01 — Test database target safety

| Field | Test specification |
| --- | --- |
| Requirements / priority | Test infrastructure; RR-09 / High |
| Preconditions and data | Local, Docker, non-test, remote and wrong-scheme URIs; missing TEST_MONGODB_URI. |
| Procedure | Validate each URI before any connection. |
| Expected result | Only a motorx_test database on an approved host is accepted; never falls back to MONGODB_URI. |
| Execution status | Executed 26 Sep 2026: 8/8 passed |
| Evidence | apps/backend/src/test/db.safety.test.ts; test-evidence/backend-results.json |

#### UT-02 — Production database URI guard

| Field | Test specification |
| --- | --- |
| Requirements / priority | PSR-10; RR-09 / High |
| Preconditions and data | Atlas SRV, TLS/non-TLS, local and test database names. |
| Procedure | Check each URI with findProductionMongoUriProblems. |
| Expected result | Production refuses unencrypted, local, test/dev databases and URIs without a database name. |
| Execution status | Executed 26 Sep 2026: 10/10 passed |
| Evidence | apps/backend/src/config/mongoUri.test.ts; test-evidence/backend-results.json |

#### UT-03 — Admin request validation

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ADMIN-02–05 / High |
| Preconditions and data | Default and bounded pages; user/listing filters; invalid status. |
| Procedure | Parse query schemas. |
| Expected result | Defaults and valid filters parse; unsupported values fail. |
| Execution status | Executed 26 Sep 2026: 4/4 passed |
| Evidence | apps/backend/src/modules/admin/admin.validation.test.ts; test-evidence/backend-results.json |

#### UT-04 — Dealer application validation

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-02,09–13 / High |
| Preconditions and data | Multipart fields; incomplete application; missing rejection reason. |
| Procedure | Parse application and review schemas. |
| Expected result | Form values normalized; incomplete data and missing rejection reason rejected. |
| Execution status | Executed 26 Sep 2026: 3/3 passed |
| Evidence | apps/backend/src/modules/dealers/dealer.validation.test.ts; test-evidence/backend-results.json |

#### UT-05 — Dealer document content checks

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-09; PSR-13–14 / High |
| Preconditions and data | Plain PDF; PDFs with JavaScript, launch action, embedded file; renamed executable; images with metadata; fake JPEG. |
| Procedure | Detect type from bytes and sanitize each file. |
| Expected result | Only safe PDFs and re-encoded images are kept; dangerous or disguised files are rejected. |
| Execution status | Executed 26 Sep 2026: 9/9 passed |
| Evidence | apps/backend/src/modules/dealers/dealerDocument.content.test.ts; test-evidence/backend-results.json |

#### UT-06 — CSV upload validation

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-UPLOAD-01–03,07 / High |
| Preconditions and data | Car and motorcycle headers; missing headers; binary files; paging. |
| Procedure | Validate files, headers and pagination. |
| Expected result | Matching headers accepted per category; bad content and missing fields rejected; paging bounded. |
| Execution status | Executed 26 Sep 2026: 6/6 passed |
| Evidence | apps/backend/src/modules/inventory/inventory.validation.test.ts; test-evidence/backend-results.json |

#### UT-07 — Upload acceptance and controlled retry

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-UPLOAD-04–06; RR-06–08 / High |
| Preconditions and data | Queue available, down, and hanging; dealer at listing limit; job-creation failure; failed and non-failed uploads. |
| Procedure | Accept uploads and request retries with mocked queue and storage. |
| Expected result | Uploads are kept for later queuing when Redis is down, the dealer is never kept waiting, storage is cleaned on failure, and only the owner’s failed jobs can be retried. |
| Execution status | Executed 26 Sep 2026: 8/8 passed |
| Evidence | apps/backend/src/modules/inventory/inventory.service.test.ts; test-evidence/backend-results.json |

#### UT-08 — Listing validation and identity

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-02–05; FR-ETL-19–21 / High |
| Preconditions and data | Plate variants, pagination, inverted ranges, empty edits, image order, category/powertrain fixtures. |
| Procedure | Normalize registrations and parse listing schemas. |
| Expected result | Equivalent plates share one identity; invalid edits, ranges and attributes fail. |
| Execution status | Executed 26 Sep 2026: 12/12 passed |
| Evidence | apps/backend/src/modules/marketplace/listing.validation.test.ts; test-evidence/backend-results.json |

#### UT-09 — Image signature check

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-13; PSR-14 / High |
| Preconditions and data | JPEG, PNG, WebP headers; spoofed JPEG; GIF. |
| Procedure | Check each file signature. |
| Expected result | Supported signatures accepted; spoofed and unsupported files rejected. |
| Execution status | Executed 26 Sep 2026: 2/2 passed |
| Evidence | apps/backend/src/modules/marketplace/listingImage.service.test.ts; test-evidence/backend-results.json |

#### UT-10 — Image re-encoding

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-13; PSR-13–14 / High |
| Preconditions and data | JPEG with GPS EXIF and rotation; trailing hidden data; 41-megapixel bomb; fake image; SVG/GIF; PNG document. |
| Procedure | Re-encode each image. |
| Expected result | Output is a clean WebP (or PNG for documents), upright, without metadata or hidden data; bombs and disallowed formats refused. |
| Execution status | Executed 26 Sep 2026: 7/7 passed |
| Evidence | apps/backend/src/shared/utils/imageReencode.test.ts; test-evidence/backend-results.json |

#### UT-11 — Photo migration and small copies

| Field | Test specification |
| --- | --- |
| Requirements / priority | PSR-13; Extension (small photo copies) / High |
| Preconditions and data | Old root-level photos with GPS; already migrated photos; dry run; CDN URL; photo without small copy; missing and undecodable objects. |
| Procedure | Run the migration against an in-memory bucket. |
| Expected result | Photos moved as clean WebP; re-runs skip finished work; dry run changes nothing; an 800 px small copy is created once and its URL recorded; problems reported, not hidden. |
| Execution status | Executed 26 Sep 2026: 6/6 passed |
| Evidence | apps/backend/src/scripts/listingImageMigration.test.ts; test-evidence/backend-results.json |

#### UT-12 — Search query analysis

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-SEARCH-08–20; FR-ETL-28 / High |
| Preconditions and data | “automatic SUV under 2 million near Colombo”; “toyata corola”; mileage vs price; oversized query; vector fixture. |
| Procedure | Analyze queries and normalize embeddings. |
| Expected result | Correct structured filters and typo corrections; bounded input; normalized 384-length vectors. |
| Execution status | Executed 26 Sep 2026: 5/5 passed |
| Evidence | apps/backend/src/modules/search/search.queryAnalyzer.test.ts; test-evidence/backend-results.json |

#### UT-13 — Vehicle similarity scoring

| Field | Test specification |
| --- | --- |
| Requirements / priority | Extension (similar vehicles, recommendations) / High |
| Preconditions and data | Same model, same make, other make; price and year differences; case/spacing; view order. |
| Procedure | Score candidates against one or several viewed vehicles. |
| Expected result | Closer vehicles score higher; recent views weigh more; ties keep newest-first order. |
| Execution status | Executed 26 Sep 2026: 5/5 passed |
| Evidence | apps/backend/src/modules/buyers/buyer.similarity.test.ts; test-evidence/backend-results.json |

#### UT-14 — Pagination metadata

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-SEARCH-06 / High |
| Preconditions and data | Partial final page; empty collection. |
| Procedure | Build pagination metadata. |
| Expected result | Correct page counts; zero pages when empty. |
| Execution status | Executed 26 Sep 2026: 2/2 passed |
| Evidence | apps/backend/src/shared/utils/pagination.test.ts; test-evidence/backend-results.json |

#### UT-15 — Token verification cache

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-USER-07–09; PSR-08 / High |
| Preconditions and data | Valid, revoked, expiring and missing tokens. |
| Procedure | Call the middleware repeatedly with a mocked Firebase Admin SDK. |
| Expected result | Firebase (with revocation) checked once per cache period; never trusted past token expiry; failures not cached. |
| Execution status | Executed 26 Sep 2026: 4/4 passed |
| Evidence | apps/backend/src/shared/middleware/verifyFirebaseToken.test.ts; test-evidence/backend-results.json |

#### UT-16 — CSV extraction

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ETL-05–06 / High |
| Preconditions and data | Multi-batch CSV stream; wrong column count. |
| Procedure | Stream records and record progress. |
| Expected result | Bounded batches with cumulative progress; malformed rows fail. |
| Execution status | Executed 26 Sep 2026: 2/2 passed |
| Evidence | apps/worker/src/pipeline/extract.test.ts; test-evidence/worker-results.json |

#### UT-17 — Vehicle normalization

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ETL-07,23 / High |
| Preconditions and data | Whitespace, enum aliases, price suffixes, blank optional cells, motorcycle rows, titles cut short to a prefix of make and model. |
| Procedure | Normalize rows per category. |
| Expected result | Consistent values; blanks stay unset; category-specific attributes; a truncated title such as “Toyota Pre” becomes “Toyota Premio”, while a longer title is kept. |
| Execution status | Executed 26 Sep 2026: 6/6 passed |
| Evidence | apps/worker/src/pipeline/normalize.test.ts; test-evidence/worker-results.json |

#### UT-18 — Batch transformation

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ETL-08–17; RR-05 / High |
| Preconditions and data | Mixed valid/invalid rows; electric car row. |
| Procedure | Prepare a batch with known starting row numbers. |
| Expected result | Valid rows kept; invalid rows isolated with their CSV row numbers. |
| Execution status | Executed 26 Sep 2026: 3/3 passed |
| Evidence | apps/worker/src/pipeline/transform.test.ts; test-evidence/worker-results.json |

#### UT-19 — Category and powertrain rules

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-03; FR-ETL-08–11 / High |
| Preconditions and data | Petrol, diesel, hybrid, electric, plug-in hybrid cars and five other categories. |
| Procedure | Validate valid and invalid combinations. |
| Expected result | Engine or battery data required as appropriate; field-level errors returned. |
| Execution status | Executed 26 Sep 2026: 17/17 passed |
| Evidence | apps/worker/src/pipeline/validate.test.ts; test-evidence/worker-results.json |

#### UT-20 — CSV ETL orchestration

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ETL-13–22,31–33; RR-06–08 / High |
| Preconditions and data | Mocked storage/repositories: mixed rows, malformed CSV, duplicates, temporary storage failure, exhausted attempts, crash mid-import, listing limit, lost lease. |
| Procedure | Run the import service and inspect writes and counters. |
| Expected result | Accurate counters; permanent vs temporary failures handled differently; resumes from the last checkpoint with no row imported twice; stops when the lease is lost. |
| Execution status | Executed 26 Sep 2026: 9/9 passed |
| Evidence | apps/worker/src/services/uploadJob.service.test.ts; test-evidence/worker-results.json |

#### UT-21 — ZIP photo processing

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-12–16; RR-06; Extension (small copies) / High |
| Preconditions and data | ZIPs with slash/backslash paths, an extra wrapper folder, photos whose extension does not match their content, unknown folders, root files, oversize entries, fake and huge images, storage errors, retries, and a ZIP with no photo in any folder. |
| Procedure | Process ZIPs with mocked storage and repositories. |
| Expected result | Photos matched by the folder that contains them (normalized plate), cleaned and resized, an 800 px copy stored and linked; a ZIP with no photos in folders fails at once with instructions; unsafe archives fail at once; retries never attach a photo twice. |
| Execution status | Executed 26 Sep 2026: 17/17 passed |
| Evidence | apps/worker/src/services/imageProcessing.service.test.ts; test-evidence/worker-results.json |

#### UT-22 — Job lease renewal

| Field | Test specification |
| --- | --- |
| Requirements / priority | RR-06–08 / High |
| Preconditions and data | Long-running job; takeover by another worker; renewal error; job end. |
| Procedure | Hold a lease with fake timers. |
| Expected result | Lease renewed every third of its duration; loss detected; temporary errors tolerated; renewal stops at the end. |
| Execution status | Executed 26 Sep 2026: 4/4 passed |
| Evidence | apps/worker/src/services/jobLease.test.ts; test-evidence/worker-results.json |

#### UT-23 — Retry classification

| Field | Test specification |
| --- | --- |
| Requirements / priority | RR-06–08 / High |
| Preconditions and data | Network, throttling, 5xx, MongoDB unreachable; missing file, access denied, parse and duplicate errors. |
| Procedure | Classify each error. |
| Expected result | Only temporary failures are retried. |
| Execution status | Executed 26 Sep 2026: 12/12 passed |
| Evidence | apps/worker/src/services/transientError.test.ts; test-evidence/worker-results.json |

#### UT-24 — Lost-job reconciliation

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ETL-03; RR-06–08 / High |
| Preconditions and data | Pending uploads with missing, waiting, delayed or active queue messages; exhausted budgets. |
| Procedure | Run one reaper cycle with mocked queue. |
| Expected result | Lost jobs re-queued under the right job ID; jobs with a live message untouched; exhausted jobs failed instead of looping. |
| Execution status | Executed 26 Sep 2026: 6/6 passed |
| Evidence | apps/worker/src/jobs/reaper.job.test.ts; test-evidence/worker-results.json |

#### UT-25 — Email outbox delivery

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-NOTIFY-06–07; RR-08 / High |
| Preconditions and data | Due emails; SMTP failures on attempts 1–5; deleted recipient. |
| Procedure | Run outbox cycles with a mocked mailer. |
| Expected result | Each email sent once; retries after 1 min, 5 min … 2 h; failed after the fifth attempt; bounded work per cycle. |
| Execution status | Executed 26 Sep 2026: 7/7 passed |
| Evidence | apps/worker/src/jobs/emailOutbox.job.test.ts; test-evidence/worker-results.json |

#### UT-26 — Document retention

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-13; PSR-15 / High |
| Preconditions and data | Decisions older than 90 days; storage delete failure. |
| Procedure | Run one retention cycle. |
| Expected result | Files deleted then record cleared; a failed delete is retried next cycle. |
| Execution status | Executed 26 Sep 2026: 3/3 passed |
| Evidence | apps/worker/src/jobs/documentRetention.job.test.ts; test-evidence/worker-results.json |

#### UT-27 — Stale-stock reminders

| Field | Test specification |
| --- | --- |
| Requirements / priority | Extension (stale stock) / High |
| Preconditions and data | Dealers with stale listings; claim won or lost; one dealer failing. |
| Procedure | Run one reminder cycle with mocked repositories. |
| Expected result | 60-day cutoff and 7-day repeat applied; each dealer gets their own count once; one failure does not stop the others. |
| Execution status | Executed 26 Sep 2026: 3/3 passed |
| Evidence | apps/worker/src/jobs/staleListingReminder.job.test.ts; test-evidence/worker-results.json |

#### UT-28 — Role-protected pages

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-USER-10–12 / High |
| Preconditions and data | Signed-out, allowed, disallowed and pending-applicant users. |
| Procedure | Render protected routes. |
| Expected result | Redirect to login, show page, show “Access Restricted” or send to the application status page as appropriate. |
| Execution status | Executed 26 Sep 2026: 4/4 passed |
| Evidence | apps/frontend/src/features/auth/components/RoleGuard.test.tsx; test-evidence/frontend-results.json |

#### UT-29 — Email verification banner

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-USER-04 / High |
| Preconditions and data | Verified, unverified and signed-out users. |
| Procedure | Render the banner and resend/refresh. |
| Expected result | Shown only when needed; resend works; hides once verified. |
| Execution status | Executed 26 Sep 2026: 4/4 passed |
| Evidence | apps/frontend/src/features/auth/components/EmailVerificationBanner.test.tsx; test-evidence/frontend-results.json |

#### UT-30 — Per-account data isolation

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-USER-12; PSR-09 / High |
| Preconditions and data | Sign-out; a different account signing in on the same browser. |
| Procedure | Switch accounts and inspect the query cache. |
| Expected result | Previous account’s cached data is cleared before the next user can see it. |
| Execution status | Executed 26 Sep 2026: 2/2 passed |
| Evidence | apps/frontend/src/features/auth/context/AuthProvider.test.tsx; test-evidence/frontend-results.json |

#### UT-31 — Dealer application from an existing account

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-09–13 / High |
| Preconditions and data | Rejected and pending applications for a signed-in buyer. |
| Procedure | Render the application page and resubmit. |
| Expected result | Rejection reason shown, answers pre-filled, no password asked, resubmission sent with new documents; pending applicants redirected. |
| Execution status | Executed 26 Sep 2026: 3/3 passed |
| Evidence | apps/frontend/src/features/auth/pages/RegisterPage.test.tsx; test-evidence/frontend-results.json |

#### UT-32 — Dealer profile editing

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-01–04 / High |
| Preconditions and data | Approved dealer profile; server error. |
| Procedure | Edit and save. |
| Expected result | Verified name and registration read-only; edits saved and confirmed; server errors shown. |
| Execution status | Executed 26 Sep 2026: 3/3 passed |
| Evidence | apps/frontend/src/portals/dealer/pages/DealerProfile.test.tsx; test-evidence/frontend-results.json |

#### UT-33 — Upload details and publish-all

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-UPLOAD-06–08; Extension (bulk) / High |
| Preconditions and data | Failed CSV, failed photos, refused retry, successful upload with 9 drafts. |
| Procedure | Render the page and use Retry and Publish all. |
| Expected result | Failure reasons and retries work; all drafts of the upload are published in one request after confirmation. |
| Execution status | Executed 26 Sep 2026: 5/5 passed |
| Evidence | apps/frontend/src/portals/dealer/pages/UploadDetails.test.tsx; test-evidence/frontend-results.json |

#### UT-34 — Bulk and stale-stock tools

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-05–08; Extension (bulk, stale) / High |
| Preconditions and data | Stats with 2 stale listings; draft and stale listings. |
| Procedure | Use the banner, select-all bulk publish, one-click “Still available” and the price dialog. |
| Expected result | Stale banner opens the stale list; one request publishes all selected; age shown; price cut previewed (5,400,000 at 10%) then applied; skipped listings explained. |
| Execution status | Executed 26 Sep 2026: 5/5 passed |
| Evidence | apps/frontend/src/portals/dealer/pages/ListingManager.test.tsx; test-evidence/frontend-results.json |

#### UT-35 — Admin approvals, dashboard and monitoring

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ADMIN-03–08 / High |
| Preconditions and data | Deep links with status/applicationId/uploadId; failing sections; date ranges. |
| Procedure | Render admin pages from links. |
| Expected result | Correct tab and exact application highlighted; failures shown as unavailable, not zero; filters passed to the server. |
| Execution status | Executed 26 Sep 2026: 6/6 passed |
| Evidence | apps/frontend/src/portals/admin/pages/adminPages.test.tsx; test-evidence/frontend-results.json |

#### UT-36 — Vehicle page on phones

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-07–11; Extension (mobile, discovery) / High |
| Preconditions and data | Listing with three photos (small copies) and a dealer phone 077 123 4567. |
| Procedure | Render, swipe, tap arrows, scroll vertically. |
| Expected result | Call/WhatsApp/Email bar with the WhatsApp message ready (94771234567); small copy chosen via srcset; swipe changes photo, vertical scroll does not; vehicle remembered for recommendations; similar vehicles shown. |
| Execution status | Executed 26 Sep 2026: 4/4 passed |
| Evidence | apps/frontend/src/portals/buyer/pages/VehicleDetails.test.tsx; test-evidence/frontend-results.json |

#### UT-37 — Compare vehicles

| Field | Test specification |
| --- | --- |
| Requirements / priority | Extension (compare) / High |
| Preconditions and data | Four vehicles; two vehicles with different price/year/mileage; one unavailable. |
| Procedure | Add to compare, open comparison. |
| Expected result | At most three; full list explained; best price, year and mileage highlighted; unavailable vehicle stated. |
| Execution status | Executed 26 Sep 2026: 4/4 passed |
| Evidence | apps/frontend/src/features/compare/compare.test.tsx; test-evidence/frontend-results.json |

#### UT-38 — Mobile navigation and card tables

| Field | Test specification |
| --- | --- |
| Requirements / priority | UR-01–04; Extension (mobile) / High |
| Preconditions and data | Portal with two pages; table with two columns. |
| Procedure | Open menu, press Escape, choose a page; render a table. |
| Expected result | Drawer opens with focus inside; closes on Escape (focus returns) and after navigation; every cell labelled with its column. |
| Execution status | Executed 26 Sep 2026: 3/3 passed |
| Evidence | apps/frontend/src/shared/components/mobileLayout.test.tsx; test-evidence/frontend-results.json |

#### UT-39 — Sinhala and Tamil

| Field | Test specification |
| --- | --- |
| Requirements / priority | Extension (languages) / High |
| Preconditions and data | All dictionaries; Tamil browser preference. |
| Procedure | Compare dictionaries; switch language; reload. |
| Expected result | Every message translated with identical placeholders; whole site switches, page lang set, choice remembered; Tamil chosen automatically for a Tamil browser. |
| Execution status | Executed 26 Sep 2026: 4/4 passed |
| Evidence | apps/frontend/src/shared/i18n/i18n.test.tsx; test-evidence/frontend-results.json |

#### UT-40 — WhatsApp number formatting

| Field | Test specification |
| --- | --- |
| Requirements / priority | Extension (mobile contact) / High |
| Preconditions and data | Local, +94, 9-digit, foreign and invalid numbers. |
| Procedure | Convert numbers and build links. |
| Expected result | Sri Lankan numbers get 94; foreign numbers kept; undialable numbers give no link. |
| Execution status | Executed 26 Sep 2026: 3/3 passed |
| Evidence | apps/frontend/src/shared/utils/phone.test.ts; test-evidence/frontend-results.json |

#### UT-41 — Queue publishing for repeat photo uploads

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-UPLOAD-08; RR-06–08 / High |
| Preconditions and data | Existing queue jobs that are completed, failed, waiting, active or delayed. |
| Procedure | Publish CSV and photo jobs with a mocked queue. |
| Expected result | A finished job is removed and queued again under the same ID, so photos attached a second time are processed; a job still waiting or running is never duplicated (finding F-09). |
| Execution status | Executed 26 Sep 2026: 4/4 passed |
| Evidence | apps/backend/src/modules/inventory/inventory.queue.test.ts; test-evidence/backend-results.json |

Unit and component result: 234 tests in 41 files, all passed.

### 3.3 Integration Testing

Integration tests cross a real boundary. Data integration tests run repository and service code against a real MongoDB 7 replica set (needed for transactions and unique indexes) and, for rate limits, a real Redis. HTTP journey tests start the real Express application and send requests through every middleware to the real database; only the Firebase Admin SDK and the S3 client are replaced. All ran in the isolated Docker project motorx-test with --maxWorkers=1. Cases IT-12 to IT-15 cross external services (real Firebase, SMTP, a queue with a live worker, a search dataset) and remain planned.

#### IT-01 — Dealer application persistence

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-09 / High |
| Preconditions and data | Empty test database; valid application. |
| Procedure | 1. Create an application. 2. Find it by user ID. |
| Expected result | One pending application with the stored fields. |
| Execution status | Executed 26 Sep 2026: 1/1 passed |
| Evidence | apps/backend/src/modules/dealers/dealer.repository.test.ts; test-evidence/backend-results.json |

#### IT-02 — Pending applications oldest first

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ADMIN-03 / High |
| Preconditions and data | Two applications submitted in order. |
| Procedure | 1. Create A then B. 2. List pending. |
| Expected result | Both returned, oldest submission first. |
| Execution status | Executed 26 Sep 2026: 1/1 passed |
| Evidence | apps/backend/src/modules/admin/admin.repository.test.ts; test-evidence/backend-results.json |

#### IT-03 — Registration uniqueness in MongoDB

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ETL-19–22; RR-08 / High |
| Preconditions and data | Active, archived and differently formatted plates. |
| Procedure | 1. Look up duplicates. 2. Insert a second draft/active listing with the same plate. 3. Relist after archiving. |
| Expected result | Duplicates found across formats; the database itself rejects a second open listing; archived plates can be relisted. |
| Execution status | Executed 26 Sep 2026: 6/6 passed |
| Evidence | apps/backend/src/modules/marketplace/listing.repository.test.ts; test-evidence/backend-results.json |

#### IT-04 — Listing update persistence

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-05 / High |
| Preconditions and data | Owned listing with a description. |
| Procedure | 1. Set description to null. 2. Set a new description. |
| Expected result | Description removed, then updated, in the stored document. |
| Execution status | Executed 26 Sep 2026: 2/2 passed |
| Evidence | apps/backend/src/modules/marketplace/listing.service.test.ts; test-evidence/backend-results.json |

#### IT-05 — Audited document access

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ADMIN-06; PSR-15 / High |
| Preconditions and data | Dealer with documents; deleted documents; invalid index. |
| Procedure | 1. Admin opens a document. 2. Open after retention deletion. 3. Open a missing index. |
| Expected result | Each view audited with who and which file; 410 Gone after deletion without an audit entry; no entry for a missing file. |
| Execution status | Executed 26 Sep 2026: 3/3 passed |
| Evidence | apps/backend/src/modules/admin/admin.documentAccess.test.ts; test-evidence/backend-results.json |

#### IT-06 — Rate limits with real Redis

| Field | Test specification |
| --- | --- |
| Requirements / priority | PSR-13; RR-10 / High |
| Preconditions and data | Limiter with small budget; Redis unavailable; real Redis store. |
| Procedure | 1. Exceed the budget. 2. Stop the store. 3. Count only successes. 4. Share one budget via Redis. 5. Exceed upload concurrency. |
| Expected result | 429 in the standard format; requests allowed when Redis is down; one shared budget across instances; 503 with Retry-After beyond the upload limit. |
| Execution status | Executed 26 Sep 2026: 5/5 passed |
| Evidence | apps/backend/src/shared/middleware/rateLimits.test.ts; test-evidence/backend-results.json |

#### IT-07 — Lease ownership and idempotent writes

| Field | Test specification |
| --- | --- |
| Requirements / priority | RR-06–08; FR-ETL-31–32 / High |
| Preconditions and data | Upload job with an expired and a valid lease; repeated batches. |
| Procedure | 1. Take over an expired lease and write as the old owner. 2. Try to claim a job with a valid lease. 3. Insert the same CSV row twice. 4. Record the same rejection twice. |
| Expected result | Only the current owner can write; a valid lease cannot be stolen; one listing per CSV row and one rejection per bad row. |
| Execution status | Executed 26 Sep 2026: 4/4 passed |
| Evidence | apps/worker/src/repositories/jobSafety.db.test.ts; test-evidence/worker-results.json |

#### IT-08 — Access control across dealers and roles

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-USER-07–12; PSR-08–09; FR-DEALER-10 / High |
| Preconditions and data | Buyer, dealers A and B, admin and a suspended user; listings, uploads, documents and notifications owned by A. |
| Procedure | 1. As B, request, edit, delete and retry A’s resources by ID. 2. Read drafts and private storage publicly. 3. Call dealer/admin routes without a token and with wrong roles. 4. Use a suspended account’s valid token. 5. Approve an applicant with an unverified email. |
| Expected result | Every foreign access is refused with no change to A’s data; drafts and private objects never public; 401/403 as appropriate; suspended accounts blocked; approval refused until the email is verified. |
| Execution status | Executed 26 Sep 2026: 10/10 passed |
| Evidence | apps/backend/src/test/accessControl.journey.test.ts; test-evidence/backend-results.json |

#### IT-09 — Dealer lifecycle and admin monitoring

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-01–13; FR-ADMIN-03–07 / High |
| Preconditions and data | Buyer applying from an existing account; admin; listings of a dealer who is later suspended. |
| Procedure | 1. Suspend a dealer and check browse, details and search; reactivate. 2. Edit the dealer profile. 3. Apply as a signed-in buyer; reject; correct and resubmit. 4. Try to apply again once approved. 5. Filter uploads and audit logs by ID and date. |
| Expected result | Suspended dealers’ listings vanish from all public views and return on reactivation; only allowed profile fields change; resubmission keeps history and replaces documents; filters return exactly the matching records. |
| Execution status | Executed 26 Sep 2026: 7/7 passed |
| Evidence | apps/backend/src/test/dealerLifecycle.journey.test.ts; test-evidence/backend-results.json |

#### IT-10 — Bulk tools, stale stock and discovery

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-05–08; Extension (bulk, stale, discovery, small copies) / High |
| Preconditions and data | Two dealers; drafts, active, sold and archived listings; listings of one CSV upload; stale dates; a suspended dealer; photos with small copies. |
| Procedure | 1. Bulk publish chosen drafts and all drafts of one upload. 2. Send a rival’s IDs. 3. Mark sold, archive, cut prices 10%, delete archived. 4. Send invalid bulk requests and a buyer’s request. 5. Check stale counts, ordering and fresh-again actions. 6. Request similar and recommended vehicles. 7. Fetch a small photo copy. |
| Expected result | Only eligible own listings change and the rest are counted as skipped; prices 6,000,000 → 5,400,000; photos and small copies deleted from storage; invalid requests 400, buyers 403; stale = active and unconfirmed for 60 days (legacy listings by update time); similar and recommended lists are ranked, exclude the seed/viewed and hidden listings; small copy served from thumbs/. |
| Execution status | Executed 26 Sep 2026: 15/15 passed |
| Evidence | apps/backend/src/test/listingTools.journey.test.ts; test-evidence/backend-results.json |

#### IT-11 — Photo URL updates in MongoDB

| Field | Test specification |
| --- | --- |
| Requirements / priority | PSR-13; Extension (small photo copies) / High |
| Preconditions and data | Listing whose photo keys contain dots, as real keys do. |
| Procedure | 1. Set the small-copy URL on one photo. 2. Rewrite both photo URLs. |
| Expected result | Only the listed photos change and all other image fields are kept (regression test for finding F-08). |
| Execution status | Executed 26 Sep 2026: 2/2 passed |
| Evidence | apps/backend/src/scripts/listingImageMigration.db.test.ts; test-evidence/backend-results.json |

#### IT-12 — Real Firebase identity

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-USER-01–09; PSR-08 / High |
| Preconditions and data | Dedicated test Firebase project or emulator [7]; buyer and dealer test accounts. |
| Procedure | 1. Sign in and call /api/v1/auth/me twice. 2. Revoke the refresh token; call again after the cache period. 3. Delete the Firebase user. |
| Expected result | One local profile per Firebase user; revoked or deleted users lose access within the cache period (2 minutes). |
| Execution status | Planned; not executed |
| Evidence | Not yet recorded |

#### IT-13 — Real SMTP delivery and failure

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-NOTIFY-06–07 / High |
| Preconditions and data | Test mailbox or local mail sink; failed import and approval events. |
| Procedure | 1. Trigger the events. 2. Check received mail. 3. Break SMTP credentials and trigger again. |
| Expected result | Mail arrives with the right content; with SMTP broken, in-app notifications remain and email status becomes pending then failed after five attempts. |
| Execution status | Planned; not executed |
| Evidence | Not yet recorded |

#### IT-14 — CSV and ZIP through queue and live worker

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-UPLOAD-04–08; FR-ETL-01–33 / High |
| Preconditions and data | Running backend + worker + Redis + MinIO; CSV with valid, invalid and duplicate rows; ZIP with matching and unknown folders. |
| Procedure | 1. Upload the CSV through the API. 2. Wait for completion. 3. Upload the ZIP. 4. Inspect listings, rejected rows, photos and small copies. |
| Expected result | Counts match the fixture; rejected rows keep their row numbers; photos and small copies attached only to this upload’s listings; unknown folder reported. |
| Execution status | Planned; not executed |
| Evidence | Not yet recorded |

#### IT-15 — Search relevance on a labelled dataset

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-SEARCH-01–20 / High |
| Preconditions and data | Over 300 listings including older exact matches; 20 pre-labelled queries. |
| Procedure | 1. Run each query with semantic search on and off. 2. Record the top five. |
| Expected result | Hard filters always hold; the labelled match is in the top five for at least 18 of 20 queries (proposed target). |
| Execution status | Planned; not executed |
| Evidence | Not yet recorded |

Integration result: 56 automated tests in 11 files, all passed (24 data-integration, 32 HTTP journey). IT-12 to IT-15 planned.

### 3.4 End-to-End Testing

End-to-end tests exercise the whole running system. Two system-level procedures were executed on running containers. The browser journeys below are written as step-by-step scripts for a tester using the real frontend with separate browser profiles for the buyer, dealer and administrator; record the actual result, tester, date and screenshots in the case register. Use a dedicated test Firebase project and synthetic data. At the time of writing these journeys have not been executed, so they are reported as “Not executed”.

#### E2E-A1 — Worker crash during a 60,000-row import (system)

| Field | Test specification |
| --- | --- |
| Requirements / priority | RR-06–08; FR-ETL-31–32; PSR-05 / High |
| Preconditions and data | Isolated Docker test stack (MongoDB replica set, Redis, MinIO, two worker containers); generated CSV of 60,000 unique rows. |
| Procedure | 1. Start the import. 2. Kill the first worker part-way through. 3. Let the second worker take over after the 2-minute lease expires. 4. Count listings and distinct source rows. |
| Expected result | Import completes without manual action; listings = 60,000 = distinct source rows; no duplicates. |
| Execution status | Executed (Sep 2026): passed — completed by the second worker in 4 min 43 s with 60,000 listings from 60,000 distinct rows. |
| Evidence | scripts/drills/kill-worker-mid-import.sh; result recorded in docs/RESILIENCE.md |

#### E2E-A2 — Live-stack smoke test with real data (system, read-only)

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-07–11; FR-SEARCH-01–06; FR-USER-10–12; PSR-01–02 / High |
| Preconditions and data | Running development stack (backend and frontend rebuilt from the baseline, real Atlas data, MinIO); GET requests only; the script checks the main photo of every active listing. |
| Procedure | 1. Run python scripts/smoke/live-stack-smoke.py. 2. Save the output to test-evidence/live-smoke-output.txt. |
| Expected result | Health/readiness 200; browse shows only active listings; price filter holds; search answers; invalid IDs 400; dealer/admin routes 401 without sign-in; details include dealer; similar/recommended exclude seed/viewed; every active listing's main photo and small copy load; frontend routes serve the app. |
| Execution status | Executed 2026-09-26 (after the photo migration): 16 passed, 1 failed, 0 skipped. Failed: only 1 of 23 active listings' main photos loads; 22 point to the old server 13.207.143.45 and their files are not in this storage (finding F-01). The one migrated photo and its small copy load. |
| Evidence | scripts/smoke/live-stack-smoke.py; test-evidence/live-smoke-output.txt and live-smoke-results.json |

#### E2E-01 — Buyer registration, sign-in and session

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-USER-01–06A / High |
| Preconditions and data | Unused test email; existing buyer account. |
| Procedure | 1. Open /signup; submit with missing fields and mismatched passwords. 2. Register a valid buyer; open the verification email. 3. Sign out and sign in. 4. Try a wrong password and a duplicate email. 5. Reload /marketplace while signed in. |
| Expected result | Clear field errors; one account created; verification banner disappears after verifying; wrong password shows “The email address or password is incorrect.”; session survives reload. |
| Execution status | Not executed (manual browser journey) |
| Evidence | Record screenshots and notes in the case register |

#### E2E-02 — Dealer application and approval

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-09–13; FR-ADMIN-03,06 / High |
| Preconditions and data | Applicant with a PDF registration and ID; admin in a second browser profile. |
| Procedure | 1. Apply at /dealer/apply. 2. Check the status page and that /dealer is refused. 3. Admin opens Dealer Approvals from the dashboard link, views both documents and approves. 4. Applicant signs in again. |
| Expected result | Application appears in Pending (oldest first); document views appear in Audit Logs; applicant reaches the Dealer Dashboard; an approval notification appears. |
| Execution status | Not executed (manual browser journey) |
| Evidence | Record screenshots and notes in the case register |

#### E2E-03 — Rejection, correction and resubmission

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-11–13 / High |
| Preconditions and data | Pending applicant; admin. |
| Procedure | 1. Admin rejects with a reason. 2. Applicant opens the status page and chooses “Correct and resubmit”. 3. Changes a field, attaches new documents and resubmits. 4. Admin reviews again. |
| Expected result | Reason shown to the applicant; form pre-filled without a password field; resubmission returns to Pending with the earlier rejection shown in its history. |
| Execution status | Not executed (manual browser journey) |
| Evidence | Record screenshots and notes in the case register |

#### E2E-04 — Create, edit, publish and photograph a vehicle

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-01–05,07–16 / High |
| Preconditions and data | Approved dealer; unique car; two photos; buyer profile. |
| Procedure | 1. Add New Vehicle with two photos as a draft. 2. Edit the price. 3. Publish from My Listings. 4. As buyer, open it from the marketplace. 5. Dealer removes one photo; buyer reloads. |
| Expected result | Draft not visible to the buyer; after publishing, details, price and dealer contacts are correct; removed photo no longer shown; photos load the small copy on a phone-width window (check the Network tab). |
| Execution status | Not executed (manual browser journey) |
| Evidence | Record screenshots and notes in the case register |

#### E2E-05 — Recover from a failed photo upload

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-12–15; RR-08–09 / High |
| Preconditions and data | New vehicle; block the image request once (DevTools request blocking). |
| Procedure | 1. Create the vehicle with two photos while one request is blocked. 2. Read the error. 3. Unblock and use “Retry images”. 4. Press Create again once, deliberately. |
| Expected result | Exactly one listing exists; the missing photo can be added from the edit page; pressing Create again is refused as a duplicate registration, not a second listing. |
| Execution status | Not executed (manual browser journey) |
| Evidence | Record screenshots and notes in the case register |

#### E2E-06 — CSV import, corrections and ZIP photos

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-UPLOAD-01–08; FR-ETL-13–22,31–33 / High |
| Preconditions and data | Category template; CSV with valid, invalid and duplicate rows; ZIP with a matching and an unknown folder. |
| Procedure | 1. Download the car template. 2. Upload the mixed CSV and watch the status. 3. Read rejected rows. 4. Upload the ZIP. 5. Use “Publish all N” on the upload page. 6. Check the marketplace. |
| Expected result | Counters match the file; each rejection names the row and reason; unknown folder listed; after Publish all, every valid vehicle is public with its photos; notifications match the result. |
| Execution status | Not executed (manual browser journey) |
| Evidence | Record screenshots and notes in the case register |

#### E2E-07 — Buyer search, filters and dealer contact on a phone

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-07–11,16; FR-SEARCH-01–20; Extension (mobile) / High |
| Preconditions and data | Seeded catalogue; DevTools device mode at 390 × 844. |
| Procedure | 1. Search “automatic SUV under 8 million near Colombo”. 2. Open “Filters (n)”, add a make, press “Show N vehicles”. 3. Try “toyata corola” and a no-match query. 4. Open a vehicle; swipe the photos; tap WhatsApp. |
| Expected result | Results respect the filters; the sheet shows the active filter count; empty results explain what to do; swipe changes photos; WhatsApp opens with the number in 94… form and the message pre-filled. |
| Execution status | Not executed (manual browser journey) |
| Evidence | Record screenshots and notes in the case register |

#### E2E-08 — Similar vehicles, recommendations and compare

| Field | Test specification |
| --- | --- |
| Requirements / priority | Extension (discovery, compare) / High |
| Preconditions and data | Catalogue with several makes; fresh browser profile. |
| Procedure | 1. Open three vehicles. 2. Return to the marketplace and check “Recommended for you”. 3. On a vehicle page, check “Similar vehicles”. 4. Add three vehicles to compare; try a fourth. 5. Open “Compare now”, remove one, reload, copy the link to another profile. |
| Expected result | Recommendations appear only after viewing and never include the viewed vehicles; similar vehicles exclude the current one; fourth vehicle refused with a message; best price/year/mileage highlighted; the shared link shows the same comparison. |
| Execution status | Not executed (manual browser journey) |
| Evidence | Record screenshots and notes in the case register |

#### E2E-09 — Bulk actions and stale stock

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-05–08; Extension (bulk, stale) / High |
| Preconditions and data | Dealer with drafts and at least one active listing whose lastConfirmedAt is older than 60 days (set in the test database). |
| Procedure | 1. Open the dashboard and read the stale banner. 2. Review now → Needs attention. 3. Use Still available, Reduce price 10% and Mark sold on different rows. 4. On My Listings, select all drafts and Publish. 5. Archive two and Delete permanently. |
| Expected result | Counts in the banner and tab match; each action updates the list and the counts; reduced price shown to buyers; skipped listings explained; deleted listings and photos gone. |
| Execution status | Not executed (manual browser journey) |
| Evidence | Record screenshots and notes in the case register |

#### E2E-10 — Stale-stock reminder notification

| Field | Test specification |
| --- | --- |
| Requirements / priority | Extension (stale stock); FR-NOTIFY-01–03 / High |
| Preconditions and data | Worker running the baseline; dealer with stale listings. |
| Procedure | 1. Start the worker. 2. Open the dealer’s notification bell. 3. Click the reminder. 4. Restart the worker. |
| Expected result | One reminder with the correct count; clicking opens the Needs attention list; no second reminder within 7 days after restart. |
| Execution status | Not executed (manual browser journey) |
| Evidence | Record screenshots and notes in the case register |

#### E2E-11 — Administrator moderation and suspension

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ADMIN-01–06,09–10; FR-USER-10–11 / High |
| Preconditions and data | Admin and an active dealer with public listings. |
| Procedure | 1. Suspend the dealer. 2. As buyer, search for their vehicle. 3. As the dealer, try to edit a listing. 4. Reactivate. 5. Check Audit Logs filtered by today. |
| Expected result | Suspended dealer’s vehicles disappear from browse, search and details; dealer actions refused; everything returns after reactivation; both actions audited with the admin’s name. |
| Execution status | Not executed (manual browser journey) |
| Evidence | Record screenshots and notes in the case register |

#### E2E-12 — Responsive layout and keyboard use

| Field | Test specification |
| --- | --- |
| Requirements / priority | UR-01–04,09–12,16–18; Extension (mobile) / High |
| Preconditions and data | Widths 360, 390, 768 and 1440 px; keyboard only. |
| Procedure | 1. On each width, use the menu in the buyer site and in the dealer and admin portals. 2. Open and close the filter sheet, compare tray and price dialog with Tab/Enter/Escape. 3. View My Listings and Upload Monitoring on a phone width. 4. Tap an input on an iPhone-size width. |
| Expected result | No page scrolls sideways; menus reachable at every width and close on Escape; focus visible and returned; tables show as labelled cards; inputs do not zoom the page; buttons at least 44 px tall. |
| Execution status | Not executed (manual browser journey) |
| Evidence | Record screenshots and notes in the case register |

#### E2E-13 — Sinhala and Tamil

| Field | Test specification |
| --- | --- |
| Requirements / priority | Extension (languages) / Medium |
| Preconditions and data | Native Sinhala and Tamil readers if available. |
| Procedure | 1. Choose සිංහල in the navbar, browse, search and open a vehicle. 2. Reload. 3. Choose தமிழ் and repeat. 4. Sign in page in each language. |
| Expected result | All buyer pages and sign-in change language; choice survives reload; text fits on a phone; readers confirm wording is natural (record their comments). |
| Execution status | Not executed (manual browser journey) |
| Evidence | Record screenshots and notes in the case register |

#### E2E-14 — Notification centre and email status

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-NOTIFY-01–07 / High |
| Preconditions and data | Dealer and admin; test mailbox. |
| Procedure | 1. Trigger a failed import and an approval. 2. Check bell counts. 3. Open and mark read; reload. 4. Check another user’s inbox. |
| Expected result | Right recipient, correct unread count after reload, email status shown; other users see nothing of it. |
| Execution status | Not executed (manual browser journey) |
| Evidence | Record screenshots and notes in the case register |

#### E2E-15 — Mobile performance audit

| Field | Test specification |
| --- | --- |
| Requirements / priority | PSR-01; Extension (mobile) / Medium |
| Preconditions and data | Production build served locally; Lighthouse in Chrome, mobile preset. |
| Procedure | 1. Audit the landing page, marketplace and one vehicle page. 2. Save the reports. |
| Expected result | Record Performance, Accessibility and Best Practices scores and LCP; compare with the pre-mobile baseline if available. |
| Execution status | Not executed (manual browser journey) |
| Evidence | Record screenshots and notes in the case register |

### 3.5 Non-functional Test Cases

#### NF-01 — 5,000-record import throughput

| Field | Test specification |
| --- | --- |
| Requirements / priority | PSR-04–06 / High |
| Preconditions and data | 5,000 unique valid car rows; real CSV pipeline, MongoDB replica set and MinIO; local Docker on the test laptop. |
| Procedure | Run with RUN_BENCHMARKS=1 (command in 3.6); repeat twice. |
| Expected result | All 5,000 rows imported within 120 s. |
| Execution status | Executed 26 Sep 2026: passed twice — 11.1 s and 11.2 s (≈450 records/s). |
| Evidence | apps/worker/src/benchmarks/importThroughput.bench.test.ts; test-evidence/benchmark-output.txt |

#### NF-02 — API and search response time

| Field | Test specification |
| --- | --- |
| Requirements / priority | PSR-01–03 / Medium |
| Preconditions and data | Known catalogue; agreed normal load; fixed provider settings. |
| Procedure | 1. Warm up 2 minutes. 2. Run browse, filter, search and details requests for 10 minutes with k6. 3. Repeat three times. |
| Expected result | Normal API p95 ≤ 2 s; structured search ≤ 2 s; semantic search normally ≤ 5 s. |
| Execution status | Partly evidenced: single smoke requests took 3–868 ms (A2); percentile run not executed. |
| Evidence | test-evidence/live-smoke-results.json (indicative only) |

#### NF-03 — Concurrent load and stability

| Field | Test specification |
| --- | --- |
| Requirements / priority | PSR-01,06–07 / Medium |
| Preconditions and data | Isolated stack; workload from 3.1.5. |
| Procedure | 1. Run 5, 20 and 50 virtual users. 2. Record latency, errors, CPU, memory and queue depth. 3. Observe recovery. |
| Expected result | Normal-load stage meets PSR targets; under 1% server errors; no data loss; memory and queue return to normal. |
| Execution status | Not executed |
| Evidence | Not yet recorded |

#### NF-04 — Upload limits and unsafe files

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-13; PSR-13–14 / Medium |
| Preconditions and data | Image pixel bomb, fake images, dangerous PDFs, ZIP expansion and entry limits, upload concurrency. |
| Procedure | Covered by UT-05, UT-09, UT-10, UT-21 and IT-06. |
| Expected result | Unsafe content refused before it can use large memory; limits return clear errors. |
| Execution status | Executed through the listed automated cases: passed. |
| Evidence | See UT-05, UT-09, UT-10, UT-21, IT-06 |

#### NF-05 — Build, configuration and supply-chain checks

| Field | Test specification |
| --- | --- |
| Requirements / priority | SRS 2.4; PSR-10,12 / Medium |
| Preconditions and data | Locked dependencies; Node 24; CI workflow. |
| Procedure | 1. Build all workspaces. 2. Run Gitleaks, Trivy and npm audit (CI). 3. Record browser versions during E2E. |
| Expected result | Builds succeed; no leaked secrets; no high/critical image vulnerabilities; browsers recorded. |
| Execution status | Executed (build) 26 Sep 2026: passed, exit 0. Security scans ran clean during the hardening work and run in CI on each push; browser matrix pending. |
| Evidence | test-evidence/build-output.txt; .github/workflows/ci.yml |

#### NF-06 — Search relevance and fallback quality

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-SEARCH-08–20 / Medium |
| Preconditions and data | Same dataset as IT-15. |
| Procedure | See IT-15; also record precision@5 with the embedding provider unavailable. |
| Expected result | Hard filters hold; target 18/20 labelled matches in the top five. |
| Execution status | Not executed |
| Evidence | Not yet recorded |

### 3.6 Environment, Data and Execution

| Environment | Configuration / purpose |
| --- | --- |
| Automated runs (this report) | Host Windows-10-10.0.26200-SP0; Docker Desktop; Node v24.21.0 in containers; Vitest 4 (backend, worker) and 5 (frontend); baseline ffac7f9. |
| Unit / component | No services needed. Frontend tests run in jsdom with two workers (memory limit on the test laptop). |
| Integration and performance | Isolated compose project motorx-test: MongoDB 7 replica set rs0 (database motorx_test), Redis 7, MinIO test bucket. Nothing is shared with the development stack. |
| Live smoke | Development stack (compose project motorx) with backend and frontend rebuilt from the baseline, real MongoDB Atlas data and local MinIO; read-only requests. |
| Browser end-to-end | Frontend, backend and worker from the baseline; dedicated test Firebase project; test mailbox; browsers recorded per run; widths 360, 390, 768 and 1440 px. |
| Continuous integration | GitHub Actions: build, backend/worker/frontend tests, Gitleaks, Trivy; weekly scheduled run. |

| Fixture | Contents |
| --- | --- |
| Accounts | Created per test with synthetic names (buyer, dealers A/B, admin, suspended user); Firebase identities replaced in integration tests. |
| Listings | Built in each test with deterministic registration numbers (e.g. CAX-1001); all six categories and fuel types covered by unit fixtures. |
| CSV and ZIP | Generated in tests: mixed valid/invalid/duplicate rows, malformed rows, backslash paths, unknown folders, oversize entries; 5,000 and 60,000-row generated files for performance and the drill. |
| Images and documents | Generated with sharp (GPS EXIF, rotation, 41 MP bomb) and hand-built PDFs (JavaScript, launch action, embedded file). |
| Browser journeys | Synthetic dealer and buyer accounts in the test Firebase project; never real customer documents. |

Commands used for this report (repository root):

```powershell
docker compose -f compose.yml -f compose.test.yml run --rm backend      # 147 backend tests
docker compose -f compose.yml -f compose.test.yml run --rm -e RUN_BENCHMARKS=1 worker   # 94 worker tests incl. benchmark
cd apps/frontend; npx vitest run                                          # 50 frontend tests
npm run build --workspaces --if-present
bash scripts/drills/kill-worker-mid-import.sh                             # crash drill (test stack)
python scripts/smoke/live-stack-smoke.py                                 # read-only smoke of a running stack
```

JSON evidence was produced by adding --reporter=json --outputFile=… to the test commands. Never point the test commands or the drill at the development stack or Atlas: the database guard (UT-01) refuses any database other than motorx_test on a local host.

### 3.7 Entry, Exit and Suspension Criteria

| Gate | Criteria |
| --- | --- |
| Entry | Baseline commit recorded; dependencies installed; build passes; isolated test stack healthy with a replica-set primary; fixtures and test accounts available. |
| Per-case pass | Every expected outcome observed and evidence linked. A partial run, an unavailable dependency or a missing feature is never a pass. |
| Exit (submission) | All automated suites pass (met: 291/291); all Critical and High browser journeys executed and passed; no open Critical/High findings or each one accepted by the team with a workaround; performance evidence for PSR-05 (met) and PSR-01–03 recorded or listed as unmet. |
| Suspend | Wrong database or storage target, unreliable fixtures, unavailable critical dependency, suspected data corruption. |
| Resume | Cause fixed; isolation rechecked; smoke test passes; affected cases rerun. |

Severity: Critical = unauthorized access or data loss; High = essential journey blocked or wrong inventory state; Medium = degraded with a workaround; Low = presentation only. Each finding records baseline, case ID, steps, expected and actual results, evidence and severity, and is retested with its neighbouring cases after the fix.

### 3.8 Responsibilities and Schedule

| Owner role | Responsibility |
| --- | --- |
| M1 — Auth/Dealers/Marketplace | E2E-01 to E2E-05, E2E-11; access-control findings. |
| M2 — Inventory/ETL | E2E-06, E2E-09, E2E-10; IT-14; crash drill reruns; NF-01. |
| M3 — Search/Notifications/Admin | E2E-07, E2E-08, E2E-14; IT-12, IT-13, IT-15; NF-02, NF-03, NF-06. |
| All members | E2E-12, E2E-13 and E2E-15 on their own phones and browsers; native-language review. |
| Cross-reviewer / supervisor | Review results and findings; record the submission decision. |

| When | Activity | Exit artifact |
| --- | --- | --- |
| Done (26 Sep) | Automated unit, integration, benchmark and smoke runs. | JSON evidence, registers, this report |
| T−3 days | Browser journeys E2E-01 to E2E-14 in the test Firebase project. | Case register with results and screenshots |
| T−2 days | Restore or re-upload photos for the 22 listings (F-01); Lighthouse audit (E2E-15); k6 load run if time allows. | Retest evidence; Lighthouse reports |
| T−1 day | Full automated regression; demo rehearsal; update Section 4.1. | Final evaluation summary |

## 4. Deliverables

| Deliverable | Location |
| --- | --- |
| Master test plan and evaluation report | docs/MotorX_Test_Plan_Report.docx (Word, from the supplied template) and docs/MotorX_Test_Plan_Report.md |
| Case register | docs/MotorX_Test_Case_Register.csv — 79 cases with level, requirements, steps, expected/actual results, tester, date and defect fields |
| Executed test register | docs/test-evidence/automated-test-register.csv — every automated test (291) with file, status and duration |
| Raw test results | docs/test-evidence/backend-results.json, worker-results.json, frontend-results.json |
| Performance and smoke evidence | docs/test-evidence/benchmark-output.txt; live-smoke-output.txt; live-smoke-results.json |
| Build and environment | docs/test-evidence/build-output.txt; run-metadata.json |
| Drill and smoke scripts | scripts/drills/kill-worker-mid-import.sh; scripts/smoke/live-stack-smoke.py |
| Still to produce | Browser journey results and screenshots, Lighthouse reports, load-test results, team sign-off |

### 4.1 Test Evaluation Summaries

| Evaluation item | Observed result | Interpretation |
| --- | --- | --- |
| Unit / component | 41 files; 234 passed; 0 failed. | Business rules, schemas, security helpers, worker services and React components behave as specified. |
| Integration — data | 8 files; 24 passed; 0 failed. | Real MongoDB constraints, leases, audit, photo URL updates and Redis limits hold. |
| Integration — HTTP journeys | 3 files; 32 passed; 0 failed. | Complete API use cases work through all middleware with correct authorization and stored results. |
| Performance (PSR-05) | 5,000 rows in 11.1–11.2 s. | Meets the 120 s target by a wide margin on the test laptop. |
| Crash recovery (system) | 60,000 rows; recovered in 4 min 43 s; no duplicates. | Lease takeover and checkpoints work with real containers. |
| Live smoke (system) | 16 passed; 1 failed; 0 skipped. | Running application with real data works end to end; the failure is F-01. |
| Total automated | 291 executed; 291 passed; 0 failed. | 100% pass rate for executed automated tests. |
| Case register | UT 41/41 executed; IT 11/15; E2E 2/17; NF 3/6. | Not-executed cases are listed separately and never counted as passed. |
| Browser end-to-end | 0 of 15 executed. | Required before the exit criteria are met. |

Assessment: the automated evidence is strong and fully green, and the running system passed a real-data smoke test apart from one configuration defect. The build is not yet fully accepted because the browser journeys (Section 3.4) have not been executed and F-01 is open. Both can be completed in the time planned in Section 3.8.

| ID | Finding | Severity / status | Action |
| --- | --- | --- | --- |
| F-01 | Photos on 22 of the 31 active listings (78 photos) point to http://13.207.143.45:3000, an old server that no longer responds, and their files are not in the current storage, so they cannot load (found by E2E-A2). The 91 photos whose files were present were migrated on 26 Sep with small copies created, and load. | High (demo) / Partly fixed | Copy the 78 original files from the old server or bucket into storage and rerun the migration with --public-url, or re-upload photos for the 22 listings; then rerun E2E-A2. |
| F-02 | The 5,000-row benchmark cleared its collections before the models were loaded, so a second run in the same test database rejected every row as a duplicate. | Medium (test defect) / Fixed | Clean-up moved after model loading; passed twice in a row. |
| F-03 | Photos uploaded before small copies existed had no 800 px copy, so phones downloaded the full photo. | Low / Fixed for all 91 stored photos | Migration run on 26 Sep created 90 copies (1 in an earlier attempt); a second run found nothing left to do. Remaining photos follow F-01. |
| F-04 | SRS FR-NOTIFY-06 asks for completion emails; the implementation emails only failed or partly failed imports (clean completion is in-app only). | Medium / Decision needed | Team to confirm the policy; test the agreed behavior in IT-13. |
| F-05 | Sinhala and Tamil text was written without native-speaker review. | Medium / Open | Review during E2E-13 and record corrections. |
| F-06 | Photo retry after a failed upload (v1.0 finding): Create could be pressed again. | Low / Fixed | Merged from main (version4): a retry now updates the saved listing and uploads only the photos still pending (“Retry Uploads”). Confirm in E2E-05. |
| F-07 | Dealer profile editing and resubmission after rejection were missing in v1.0. | — / Resolved | Implemented and covered by IT-09, UT-31 and UT-32. |
| F-09 | Attaching photos to the same upload a second time did nothing: the queue kept the finished job and ignored a new one with the same ID, leaving the status “pending”. Reported by a teammate on main (version4). | High / Fixed | Finished jobs are now removed and queued again under the same ID (the reaper relies on that ID); covered by UT-41. The teammate’s random-ID fix was not used because it would stop the reaper finding lost jobs. |
| F-10 | Merging main (version4) into this branch: 16 files conflicted, because both branches built dealer profile editing, resubmission and listing-manager changes. The automatic merge also produced duplicate code that would not compile and a review-history change that would make approvals fail. | High (integration) / Resolved | This branch’s tested versions kept for the overlapping features; the teammate’s unique fixes (F-06, F-09, ZIP wrapper folders, empty-ZIP message, title restoration, category filter, archived count) ported with tests; full suites rerun (291/291). |
| F-08 | The photo migration crashed on its first database write: photo keys contain dots, which MongoDB refused inside the update expression. The dry run and the fake-storage tests could not show this. No data was changed. | High (tooling) / Fixed | Update rewritten to match keys safely; new real-MongoDB test IT-11; migration then completed (0 failures) and a second run changed nothing. |

### 4.2 Reporting on Test Coverage

Requirement coverage is tracked in the case register (requirement → case → result → evidence → finding). The table maps each requirement area to its cases. Code line/branch coverage was not collected (no coverage tool is installed), so no percentage is claimed.

| Requirement area | Cases | Coverage evidence |
| --- | --- | --- |
| FR-USER-01–12 / PSR-08–09 | UT-15, UT-28–30; IT-08; E2E-01, E2E-11; IT-12 planned | Authorization, suspension, cache isolation and token handling executed; real Firebase pending. |
| FR-DEALER-01–13 | UT-04, UT-05, UT-31, UT-32; IT-01, IT-05, IT-09; E2E-02, E2E-03 | Application, documents, review, resubmission and profile editing executed at API level; browser pending. |
| FR-MARKET-01–16 | UT-08–11, UT-21, UT-36; IT-03, IT-04, IT-10; E2E-04, E2E-05, E2E-07 | Lifecycle, uniqueness, photos and details executed; browser pending; F-01 open. |
| FR-UPLOAD-01–08 | UT-06, UT-07, UT-33, UT-41; IT-14 planned; E2E-06 | Validation, acceptance, retry and publish-all executed; live queue-to-worker run pending. |
| FR-ETL-01–33 / RR-02–08 | UT-16–25; IT-03, IT-07; E2E-A1; NF-01 | Pipeline, leases, idempotency, retries, reaper, crash recovery and throughput executed. |
| FR-SEARCH-01–20 | UT-12, UT-14; IT-10; E2E-A2, E2E-07; IT-15, NF-06 planned | Analysis, filters and live search executed; relevance dataset pending. |
| FR-NOTIFY-01–07 | UT-25, UT-27; E2E-10, E2E-14; IT-13 planned | Outbox retries and reminders executed; real SMTP pending; F-04 decision. |
| FR-ADMIN-01–10 | UT-03, UT-35; IT-02, IT-05, IT-09; E2E-02, E2E-11 | Approvals, monitoring filters, audit and moderation executed at API level. |
| UR-01–18 | UT-36–40; E2E-07, E2E-12, E2E-13 | Component behavior executed; visual and usability checks pending. |
| PSR-01–07 | NF-01, NF-02, NF-03; E2E-A2 | PSR-05 met; latency indicative only; load test pending. |
| PSR-10–16 / RR-09–10 | UT-01, UT-02, UT-05, UT-09, UT-10, UT-26; IT-05, IT-06, IT-11; NF-04, NF-05 | Input safety, rate limits, document retention, guards and CI scans executed. |
| Extensions (mobile, languages, discovery, compare, stale, bulk, small copies) | UT-11, UT-13, UT-27, UT-33, UT-34, UT-36–40; IT-10; E2E-07–10, E2E-12, E2E-13, E2E-15 | All automated cases executed and passed; browser journeys pending. |

Pass rate = passed ÷ executed. Not-executed cases are reported separately and never raise the pass rate. A case group and its individual tests are two views of the same work and are not added together.

## 5. Risks, Dependencies, Assumptions, and Constraints

| Risk / likelihood / impact | Mitigation strategy | Contingency |
| --- | --- | --- |
| Tests touching a real database / Low / Critical | Test database guard (motorx_test on a local host only); separate compose project; serial execution. | Stop, check the target, restore only test fixtures. |
| Browser journeys not finished before submission / Medium / High | Journeys scripted step by step and assigned per member (3.8); automated journeys already cover the API behavior. | Report unexecuted journeys honestly with the automated evidence. |
| Demo photos not loading (F-01) / Observed / High | Recover the 78 original files, or re-upload photos for the demo listings, then rerun the smoke test. | Demonstrate with listings whose photos load; explain F-01. |
| External services (Firebase, Atlas, SMTP, embeddings) unavailable / Medium / High | External calls replaced in automated tests; readiness endpoint; fallback search; email outbox retries. | Show the automated evidence; retry the live checks when service returns. |
| Internet or DNS drop during live tests / Observed / Medium | The backend refuses to start without Atlas (observed on 26 Sep); isolated test stack needs no internet. | Wait for connectivity, restart the backend, rerun the smoke test. |
| Replaced dependencies hide integration faults / Medium / High | HTTP journeys use the real app and database; smoke and browser journeys use real Firebase and storage. | Treat IT-12 to IT-15 as required before claiming full integration. |
| Laptop resource limits / Observed / Medium | Frontend tests limited to two workers; tests run in Docker one file at a time. | Close other applications; rerun. |
| Translation quality (F-05) / Medium / Medium | Native-speaker review in E2E-13. | Fall back to English for any unreviewed text. |
| Sensitive artifacts / Low / High | Synthetic data only; secrets never printed; smoke is read-only. | Remove and regenerate any artifact containing personal data. |

Dependencies: Docker Desktop; locked npm packages; internet for Atlas and Firebase during live checks; team availability for browser journeys. Assumptions: the team keeps the M1/M2/M3 ownership in team-work-plan.md; the test Firebase project is separate from any production project. Constraints: no automated browser suite (Playwright proposed); no code-coverage tool installed; load testing and production (AWS/CloudFront) checks outside this run.

## 6. References

[1] Group 23, “MotorX Software Requirements Specification,” v1.0, 9 Aug. 2026. Repository file: Gropu23_SRS.pdf, sections 2–5.

[2] Group 23, “MotorX Software Architecture Document.” Repository file: Group23_SAD.pdf.

[3] Group 23, MotorX source repository, commit ffac7f9d5dfc7112ff82cd482f37030bf7874344. README.md; docs/RESILIENCE.md; docs/api-contract.md; compose.test.yml; .github/workflows/ci.yml.

[4] Vitest, “Getting Started.” Available: https://vitest.dev/guide/ (Accessed on 26 Sep. 2026).

[5] Microsoft, “Playwright — Installation.” Available: https://playwright.dev/docs/intro (Accessed on 26 Sep. 2026). Proposed for automating Section 3.4.

[6] Docker, “Docker Compose.” Available: https://docs.docker.com/compose/ (Accessed on 26 Sep. 2026).

[7] Google, “Introduction to Firebase Local Emulator Suite.” Available: https://firebase.google.com/docs/emulator-suite (Accessed on 26 Sep. 2026).

[8] Testing Library, “React Testing Library.” Available: https://testing-library.com/docs/react-testing-library/intro/ (Accessed on 26 Sep. 2026).

[9] ladjs, “supertest.” Available: https://github.com/ladjs/supertest (Accessed on 26 Sep. 2026).

[10] Grafana Labs, “k6 documentation.” Available: https://grafana.com/docs/k6/latest/ (Accessed on 26 Sep. 2026). Proposed load-testing tool.

[11] Google, “Lighthouse overview.” Available: https://developer.chrome.com/docs/lighthouse/overview (Accessed on 26 Sep. 2026).

[12] IEEE, “IEEE Standard for Software and System Test Documentation,” IEEE Std 829-2008, 2008.

[13] Supplied “6 Template for Test plan.docx,” Rational Unified Process master test-plan template.

[14] MotorX test evidence, 26 Sep 2026: docs/test-evidence (backend/worker/frontend JSON results, automated-test-register.csv, benchmark-output.txt, live-smoke-output.txt, build-output.txt, run-metadata.json).
