# MotorX — Master Test Plan and Baseline Evaluation Report

Version 1.0 • Group 23 • 21 September 2026

## Document control

| Item | Value |
| --- | --- |
| Project | MotorX — Second-Hand Vehicle Marketplace with Intelligent Search and Automated Inventory Processing |
| Document | Master Test Plan and Baseline Test Evaluation Report |
| Version / date | 1.0 / 21 September 2026 |
| Prepared for | Group 23 — pre-submission review |
| Baseline | d57b9cc714a2634f0e16c210589d5f236471f841 |
| Status | Prepared for team review; release acceptance pending integration and end-to-end execution |
| Template | 6 Template for Test plan.docx — its six main sections and eight technique categories are retained. |
| Approval | Project team / supervisor review pending; no approval is implied by this report. |

## Revision History

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 21 Sep 2026 | 1.0 | Initial MotorX-specific plan, case register and verified automated-test baseline. | Group 23 project documentation |

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

Navigation: section headings appear in Word’s Navigation Pane. The contents list deliberately omits page numbers so it remains valid after editing.

## 1. Evaluation Mission and Test Motivation

MotorX connects buyers with dealer-owned second-hand vehicles and reduces manual inventory entry through category-specific CSV imports, background processing and ZIP image attachment. A React/TypeScript interface communicates with an Express modular backend; a separate worker processes BullMQ jobs. MongoDB stores application records, Redis supports the queue, S3-compatible storage holds files, and Firebase supplies authentication. Search combines structured constraints with lexical and semantic ranking. [1]–[3]

The evaluation mission is to establish whether the submission build supports its essential buyer, dealer and administrator journeys, protects ownership boundaries, preserves inventory integrity and satisfies measurable SRS expectations. Testing prioritizes lost or duplicated inventory, unauthorized access, incomplete approval flows, incorrect search results and visible demo failures.

This document is both a forward-looking test plan and a limited baseline evaluation report. A planned case is not a passed test. The 77 executed automated tests establish only their asserted behavior; they do not establish full SRS compliance, browser usability, production security, external email delivery or load capacity. No live user data was altered for this report.

Source priority: the SRS defines required behavior; current source code defines the implementation under test; the supplied Word template defines report organization. Template authoring guidance has been replaced with MotorX content. Disagreements between the SRS and implementation are recorded as issues requiring resolution, rather than silently redefining expected results.

## 2. Target Test Items

| Target | Scope and interfaces | Priority |
| --- | --- | --- |
| Authentication and users | Firebase sign-in, token verification, local profile, buyer/dealer/admin roles, suspension, ownership checks. | Critical |
| Dealer management | Application documents, pending/approved/rejected states, approval audit and public dealer details; profile editing requirement. | High |
| Marketplace | Category-aware create/edit, availability, image upload/removal, buyer details, dealer pagination and totals. | Critical |
| Inventory and ETL | CSV templates, upload metadata, object storage, BullMQ, validation, normalization, duplicates, rejected rows, counters, retries and ZIP images. | Critical |
| Search | Filters, natural-language extraction, typo correction, ranking, pagination, embedding consistency and lexical fallback. | High |
| Administration and notifications | Review, moderation, account status, audit, system statistics, scoped inbox, unread count and email status. | High |
| Shared contracts | Zod schemas, vehicle attributes, registration identity and embedding helpers exercised through consumers. | High |
| Deployment and dependencies | Workspace builds, Compose, MongoDB replica set, Redis, object storage, Firebase configuration and health endpoints. | High |
| Client environments | Desktop and responsive mobile/tablet flows in modern Chrome/Edge/Firefox; Safari where a device is available. | Medium |

Outside this submission test campaign: payment processing, financing, chat and other unimplemented product extensions; penetration testing of third-party providers; physical hardware failures; proof of monthly production availability from a short test run. Production AWS failover requires a separately controlled environment. Missing SRS features remain visible as acceptance gaps, not exclusions.

## 3. Test Approach

Use a bottom-up sequence: deterministic unit/component checks, real-service integration tests, then complete browser journeys. Apply equivalence partitioning, boundary-value analysis, negative inputs, state-transition testing and two-user ownership checks. Re-run affected tests after fixes and the essential regression set before submission. Compare outputs with explicit expected fixtures, API contracts and persisted records; a successful HTTP response alone is insufficient.

| Level | Boundary | Current position |
| --- | --- | --- |
| Unit / isolated component | Pure functions and schemas; worker service orchestration with storage/repository/notification dependencies mocked. | 77 tests passed in this report run. |
| Database integration | Repository functions against real disposable MongoDB. | 3 existing test files, 6 test cases; not executed in this report run. |
| API / service integration | HTTP middleware + services + database; queue, worker and object storage where relevant. | Additional cases specified below; implementation and execution pending. |
| End-to-end | Browser + authentication + backend + worker + storage + persisted state. | Manual procedures specified; browser automation proposed, not installed or run by this task. |

The worker transformation test whose name contains “end to end” exercises a local batch transformation only. It is classified here as a component test, not a browser/system end-to-end test. Mocked worker tests do not establish real queue delivery, database transactions or recovery after a process crash.

### 3.1 Testing Techniques and Types

#### 3.1.1 Data and Database Integrity Testing

| Template field | MotorX application |
| --- | --- |
| Technique Objective | Preserve valid listings, ownership, upload lineage, accurate counters and duplicate rules. |
| Technique | Seed a small known dataset; execute repository/API operations; inspect MongoDB and storage independently. Test duplicate races, rollback and replay. |
| Oracles | Expected document counts, normalized identities, immutable ownership, audit records and absence of partial writes. |
| Required Tools | Existing Vitest/Mongoose tests; disposable MongoDB replica set; mongosh; API test harness. |
| Success Criteria | All critical database cases pass; invalid rows are never persisted as valid listings; replay does not increase the unique listing count. |
| Special Considerations | Cleanup deletes test records. Require TEST_MONGODB_URI and an isolated motorx_test database. Run repository files serially because their cleanup touches shared collections. |

#### 3.1.2 Function Testing

| Template field | MotorX application |
| --- | --- |
| Technique Objective | Verify required buyer, dealer and administrator business rules with valid and invalid inputs. |
| Technique | Execute unit checks, route-level requests and user journeys with positive, negative and boundary fixtures. |
| Oracles | SRS, shared schemas, status codes, visible messages, final database state and actor-specific permissions. |
| Required Tools | Vitest; existing Supertest dependency for proposed API tests; browser manual execution or proposed Playwright [4], [5]. |
| Success Criteria | Critical flows pass with expected data and negative outcomes; failures are logged with reproducible steps. |
| Special Considerations | Differentiate an implemented behavior from an SRS requirement still missing; never mark a missing flow as passed. |

#### 3.1.3 User Interface Testing

| Template field | MotorX application |
| --- | --- |
| Technique Objective | Verify understandable navigation, accessible forms and responsive primary screens. |
| Technique | Use keyboard-only navigation and viewport sizes 390×844, 768×1024 and 1440×900; inspect pending, error and empty states. |
| Oracles | Controls remain usable, labels are present, focus is visible, actions produce feedback and no essential content is clipped. |
| Required Tools | Browser developer tools, screenshots, keyboard and optional Playwright browser checks [5]. |
| Success Criteria | Core journeys work at each selected viewport; no blocking navigation or form issue remains. |
| Special Considerations | Device emulation is not proof of physical-device compatibility. Confirm actual Safari behavior if Safari support is claimed. |

#### 3.1.4 Performance Profiling

| Template field | MotorX application |
| --- | --- |
| Technique Objective | Measure API/search latency and ETL throughput against PSR-01–06. |
| Technique | Warm up, repeat structured and intelligent searches, import 5,000 rows, and record timings, provider mode, resource use and errors. |
| Oracles | PSR-01: at least 95% of normal API requests within 2 seconds. PSR-02: structured search within 2 seconds. PSR-03: semantic search normally within 5 seconds, with provider delays reported separately. PSR-05: approximately 5,000 records within 2 minutes in the defined environment. |
| Required Tools | A scripted HTTP timing driver, Node timing APIs, worker logs and container resource metrics. |
| Success Criteria | Required thresholds met under a recorded workload; no measurement is claimed until evidence exists. |
| Special Considerations | Record dataset, CPU/RAM, network, build, model and enrichment settings. Do not remove failed requests from the results or present local embeddings as external-provider performance. |

#### 3.1.5 Load Testing

| Template field | MotorX application |
| --- | --- |
| Technique Objective | Verify responsive browsing during concurrent searches and imports. |
| Technique | Proposed baseline: 5 concurrent clients, then 20, then 50 for 10 minutes per stage after 2 minutes warm-up. Mix 70% browse, 20% search, 10% details; run one 5,000-row import alongside the baseline. |
| Oracles | Latency percentiles, request error rate, ETL completion time, queue depth, memory and persisted record counts. |
| Required Tools | Proposed bounded Node HTTP load script and container metrics; workload script is not supplied by this report. |
| Success Criteria | SRS latency targets at the agreed expected-load stage; proposed additional target under 1% unexpected server errors. Higher stages characterize limits. |
| Special Considerations | Concurrency values and the error-rate target are proposed test parameters, not SRS promises. Agree the expected-load stage before acceptance; run only on isolated infrastructure. |

#### 3.1.6 Security and Access Control Testing

| Template field | MotorX application |
| --- | --- |
| Technique Objective | Verify authentication, role restrictions, resource ownership, input validation and protected documents. |
| Technique | Send absent/invalid tokens and valid tokens for wrong roles; substitute another dealer’s IDs; exercise suspended accounts and spoofed uploads. |
| Oracles | 401 without valid authentication; 403 for disallowed roles; forbidden or not-found for foreign resources; no state change, document exposure or credential leakage. |
| Required Tools | HTTP test harness, test Firebase identities or explicitly configured emulator, browser developer tools [7]. |
| Success Criteria | All access-control cases deny prohibited actions and permit authorized actions; no critical security finding remains. |
| Special Considerations | Use synthetic accounts and documents. A stubbed token verifier tests downstream policy only, not Firebase verification itself. |

#### 3.1.7 Failover and Recovery Testing

| Template field | MotorX application |
| --- | --- |
| Technique Objective | Verify recovery from storage, queue, database, SMTP and worker interruption without data loss or duplicate processing. |
| Technique | Interrupt test services at controlled checkpoints, restore them, replay jobs and inspect leases, progress, terminal states and unique rows. |
| Oracles | Persisted records and status agree; recoverable failures retry; completed work is not duplicated; email failure does not remove in-app notifications. |
| Required Tools | Dedicated Compose stack, service logs, database inspection and controlled dependency fault injection [6]. |
| Success Criteria | REC cases recover with accurate final counts or an explicit actionable terminal failure; readiness reflects database loss. |
| Special Considerations | No redundant application deployment is established here. Test restart/recovery, not an unsupported claim of automatic infrastructure failover. Never stop a shared/demo stack for this campaign. |

#### 3.1.8 Configuration Testing

| Template field | MotorX application |
| --- | --- |
| Technique Objective | Verify reproducible builds and correct behavior across documented configurations. |
| Technique | Build all workspaces; validate Compose; verify configured frontend origin, API URL, auth project, storage URLs and health endpoints; smoke-test browsers. |
| Oracles | Build logs, successful health responses, permitted CORS requests, visible images and working deep links. |
| Required Tools | npm/TypeScript/Vite, Docker Compose and browser developer tools [6]. |
| Success Criteria | All workspaces build and chosen deployment/browser combinations complete the smoke journey. |
| Special Considerations | This run used Windows and Node 22.19.0; CI declares Node 20. Validate the locked dependency set in CI rather than assuming those environments are interchangeable. |

### 3.2 Unit and Component Testing

The following groups map directly to the 14 executed test files. Individual test names and outcomes are included in test-evidence/automated-test-register.csv and the original JSON reports. Run with installed locked dependencies; these selected suites require no live database or browser. Shared contracts are exercised indirectly; the shared-contracts package test command itself remains a placeholder.

#### UT-01 — Database target safety

| Field | Test specification |
| --- | --- |
| Requirements / priority | Test infrastructure; RR-09 / High |
| Preconditions and data | Use local disposable, Docker, non-test, remote and unsupported-scheme URIs; clear TEST_MONGODB_URI for the missing-value case. |
| Procedure | Call URI validation and configuration helpers for each fixture. |
| Expected result | Accept allowed disposable targets; reject unsafe/missing targets before connecting; never fall back to MONGODB_URI. |
| Execution status | Executed: 8/8 passed |
| Evidence / recording | apps/backend/src/test/db.safety.test.ts; test-evidence/backend-unit-results.json. Record actual result, tester, execution date, and defect ID in the case register. |

#### UT-02 — Admin request validation

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ADMIN-02–05 / High |
| Preconditions and data | Default/bounded page inputs; supported user/listing filters; invalid status. |
| Procedure | Parse query schemas with valid and invalid fixtures. |
| Expected result | Defaults and valid filters parse; unsupported values fail validation. |
| Execution status | Executed: 4/4 passed |
| Evidence / recording | apps/backend/src/modules/admin/admin.validation.test.ts; test-evidence/backend-unit-results.json. Record actual result, tester, execution date, and defect ID in the case register. |

#### UT-03 — Dealer application validation

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-02,09–13 / High |
| Preconditions and data | Multipart field strings; incomplete application; missing rejection reason. |
| Procedure | Parse application and review schemas. |
| Expected result | Normalize form values; reject missing required application data and absent rejection reason. |
| Execution status | Executed: 3/3 passed |
| Evidence / recording | apps/backend/src/modules/dealers/dealer.validation.test.ts; test-evidence/backend-unit-results.json. Record actual result, tester, execution date, and defect ID in the case register. |

#### UT-04 — CSV upload validation

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-UPLOAD-01–03,07 / High |
| Preconditions and data | Category headers for cars and motorcycles; missing headers; binary/non-CSV files; invalid paging. |
| Procedure | Validate file/header fixtures and pagination schemas. |
| Expected result | Accept matching category headers; reject unsupported content and missing fields; bound history/rejection pagination. |
| Execution status | Executed: 6/6 passed |
| Evidence / recording | apps/backend/src/modules/inventory/inventory.validation.test.ts; test-evidence/backend-unit-results.json. Record actual result, tester, execution date, and defect ID in the case register. |

#### UT-05 — Listing validation and identity

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-02–05; FR-ETL-19–21 / High |
| Preconditions and data | Plate formatting variants, pagination bounds, inverted filters, empty edits, image ordering, petrol/electric/category fixtures. |
| Procedure | Normalize registration values and parse listing schemas. |
| Expected result | Equivalent plates share identity; invalid edits/ranges/category attributes fail; valid petrol listing parses. |
| Execution status | Executed: 12/12 passed |
| Evidence / recording | apps/backend/src/modules/marketplace/listing.validation.test.ts; test-evidence/backend-unit-results.json. Record actual result, tester, execution date, and defect ID in the case register. |

#### UT-06 — Image signature validation

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-13; PSR-14 / High |
| Preconditions and data | JPEG, PNG and WebP headers; spoofed JPEG and unsupported GIF. |
| Procedure | Call hasValidImageSignature for each fixture. |
| Expected result | Supported signatures accepted; spoofed or unsupported content rejected. This does not prove complete image decoding. |
| Execution status | Executed: 2/2 passed |
| Evidence / recording | apps/backend/src/modules/marketplace/listingImage.service.test.ts; test-evidence/backend-unit-results.json. Record actual result, tester, execution date, and defect ID in the case register. |

#### UT-07 — Search query and embedding helpers

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-SEARCH-08–20; FR-ETL-28 / High |
| Preconditions and data | “automatic SUV under 2 million near Colombo”; “toyata corola”; mileage/year query; oversized query; vector fixture. |
| Procedure | Analyze queries, validate request bounds and normalize embeddings. |
| Expected result | Expected structured fields/typo corrections; bounded input; local vector length 384 and normalized magnitude. |
| Execution status | Executed: 5/5 passed |
| Evidence / recording | apps/backend/src/modules/search/search.queryAnalyzer.test.ts; test-evidence/backend-unit-results.json. Record actual result, tester, execution date, and defect ID in the case register. |

#### UT-08 — Pagination metadata

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-SEARCH-06 / High |
| Preconditions and data | Partial final page and empty collection. |
| Procedure | Calculate pagination metadata for both fixtures. |
| Expected result | Correct final page counts; zero total pages for an empty collection. |
| Execution status | Executed: 2/2 passed |
| Evidence / recording | apps/backend/src/shared/utils/pagination.test.ts; test-evidence/backend-unit-results.json. Record actual result, tester, execution date, and defect ID in the case register. |

#### UT-09 — CSV extraction

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ETL-05–06 / High |
| Preconditions and data | Readable CSV stream with multiple batches; malformed row width. |
| Procedure | Consume extraction output and record batch/progress callbacks. |
| Expected result | Bounded batches and cumulative progress; malformed column counts fail. |
| Execution status | Executed: 2/2 passed |
| Evidence / recording | apps/worker/src/pipeline/extract.test.ts; test-evidence/worker-results.json. Record actual result, tester, execution date, and defect ID in the case register. |

#### UT-10 — Vehicle normalization

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ETL-07,23 / High |
| Preconditions and data | Whitespace/enums/numbers/price suffixes; optional blanks; motorcycle fields. |
| Procedure | Normalize each row for the selected category. |
| Expected result | Consistent values and category-specific attributes; optional blanks remain unset. |
| Execution status | Executed: 4/4 passed |
| Evidence / recording | apps/worker/src/pipeline/normalize.test.ts; test-evidence/worker-results.json. Record actual result, tester, execution date, and defect ID in the case register. |

#### UT-11 — Batch transformation

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ETL-08–17; RR-05 / High |
| Preconditions and data | Mixed valid/invalid rows and electric-car row with battery details. |
| Procedure | Run prepareInventoryBatch with a known starting CSV row number. |
| Expected result | Keep valid rows; isolate invalid rows with original row numbers; retain electric attributes. |
| Execution status | Executed: 3/3 passed |
| Evidence / recording | apps/worker/src/pipeline/transform.test.ts; test-evidence/worker-results.json. Record actual result, tester, execution date, and defect ID in the case register. |

#### UT-12 — Category and powertrain rules

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-03; FR-ETL-08–11 / High |
| Preconditions and data | Petrol/diesel/hybrid/electric/plug-in hybrid cars and the other five supported categories. |
| Procedure | Validate valid and missing/invalid required attribute combinations. |
| Expected result | Accept valid categories; require engine or battery data as appropriate; return field-level failures. |
| Execution status | Executed: 17/17 passed |
| Evidence / recording | apps/worker/src/pipeline/validate.test.ts; test-evidence/worker-results.json. Record actual result, tester, execution date, and defect ID in the case register. |

#### UT-13 — ZIP image orchestration

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-12–16; RR-06 / High |
| Preconditions and data | Mock repositories/storage; ZIP paths with slash/backslash; unknown folder; root file; existing image count; download failure. |
| Procedure | Run image processor with mocked boundaries and inspect calls/results. |
| Expected result | Match normalized plates; report unmatched folders; skip unsupported entries; respect configured image capacity; record download failure. |
| Execution status | Executed: 6/6 passed |
| Evidence / recording | apps/worker/src/services/imageProcessing.service.test.ts; test-evidence/worker-results.json. Record actual result, tester, execution date, and defect ID in the case register. |

#### UT-14 — CSV ETL orchestration

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ETL-13–22,31–33 / High |
| Preconditions and data | Mock storage and repositories; valid+invalid rows; malformed CSV; duplicate registration. |
| Procedure | Run extractInventoryUpload and inspect persistence/status calls and counters. |
| Expected result | Mixed file returns 2 processed, 1 valid, 1 rejected, 0 duplicate; malformed file fails; duplicate goes to rejection path. |
| Execution status | Executed: 3/3 passed |
| Evidence / recording | apps/worker/src/services/uploadJob.service.test.ts; test-evidence/worker-results.json. Record actual result, tester, execution date, and defect ID in the case register. |

Additional unit coverage proposed: auth middleware denial paths, notification recipient selection, transient retry classification, lease ownership/renewal, image expansion budgets and frontend pending/error states. These are gaps, not part of the 77 passing assertions.

### 3.3 Integration Testing

Integration tests cross a real persistence or service boundary. Use a disposable replica set for transactions, a separate Redis instance and a dedicated object-storage bucket. Run existing repository suites with --maxWorkers=1 because each clears shared registered collections. The three existing suites below have six cases in total; no current-run integration result is claimed because Docker daemon access was denied in this environment.

#### IT-01 — Dealer repository persistence

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-09 / High |
| Preconditions and data | Empty test database; valid application fixture. |
| Procedure | 1. Create a dealer application. 2. Retrieve it by user ID. 3. Inspect stored state. |
| Expected result | One matching application with pending status and expected fields. |
| Execution status | Existing automated; not executed |
| Evidence / recording | apps/backend/src/modules/dealers/dealer.repository.test.ts (1 case). Record actual result, tester, execution date, and defect ID in the case register. |

#### IT-02 — Admin pending-application order

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ADMIN-03 / High |
| Preconditions and data | Empty test database; A Motors and B Motors applications. |
| Procedure | 1. Create A then B. 2. List pending applications. |
| Expected result | Both pending applications returned in creation order. |
| Execution status | Existing automated; not executed |
| Evidence / recording | apps/backend/src/modules/admin/admin.repository.test.ts (1 case). Record actual result, tester, execution date, and defect ID in the case register. |

#### IT-03 — Registration lookup against MongoDB

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ETL-19–21 / High |
| Preconditions and data | Active and archived normalized-plate fixtures. |
| Procedure | 1. Look up alternate plate formatting. 2. Query archived-only plate. 3. Exclude current listing ID. 4. Query another plate. |
| Expected result | Active match found; archived/self/different-plate cases do not incorrectly block. This lookup suite alone does not prove atomic concurrent uniqueness. |
| Execution status | Existing automated; not executed |
| Evidence / recording | apps/backend/src/modules/marketplace/listing.repository.test.ts (4 cases). Record actual result, tester, execution date, and defect ID in the case register. |

#### IT-04 — Identity synchronization and route authorization

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-USER-04,06A,07–12; PSR-08–09 / High |
| Preconditions and data | Real test Firebase token or configured emulator; buyer, dealer A/B, admin and suspended user. |
| Procedure | 1. Call /api/v1/auth/me twice. 2. Call dealer/admin routes with each role. 3. Repeat without/with invalid token. 4. Substitute dealer B listing ID as A. |
| Expected result | One local profile per UID; allowed routes succeed; unauthorized calls deny access and cause no writes. |
| Execution status | Planned; not executed |
| Evidence / recording | Implement HTTP integration harness; record response and database evidence. Record actual result, tester, execution date, and defect ID in the case register. |

#### IT-05 — Approval transaction and audit

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-10–13; FR-ADMIN-06 / High |
| Preconditions and data | Pending application; admin identity; replica set. |
| Procedure | 1. Approve application. 2. Inspect dealer, user role and audit. 3. Repeat review. 4. Inject failure inside review transaction. |
| Expected result | Dealer status and user role change together with a review audit; duplicate review is controlled; rollback leaves no partial approval. |
| Execution status | Planned; not executed |
| Evidence / recording | HTTP responses plus before/after database snapshot. Record actual result, tester, execution date, and defect ID in the case register. |

#### IT-06 — Listing lifecycle and ownership

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-01–07A; FR-USER-12 / High |
| Preconditions and data | Approved dealer A/B; valid car fixture. |
| Procedure | 1. Create draft as A. 2. Edit description/price. 3. Publish. 4. Mark sold/archive. 5. Attempt edits as B. 6. Inspect public browse at each state. |
| Expected result | Edits persist, ownership remains A, only eligible active listings appear publicly, foreign modifications fail. |
| Execution status | Planned; not executed |
| Evidence / recording | Listing/API/storage-independent database evidence. Record actual result, tester, execution date, and defect ID in the case register. |

#### IT-07 — Image storage and metadata consistency

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-12–16 / High |
| Preconditions and data | Dealer-owned listing; real test bucket; valid PNG and spoofed file. |
| Procedure | 1. Upload valid image. 2. Fetch public image. 3. Remove image. 4. Try spoofed/oversize image. 5. Inject metadata failure after storage write. |
| Expected result | Stored content and metadata agree; removed image is no longer exposed; invalid uploads fail; no unreconciled orphan remains after recovery. |
| Execution status | Planned; not executed |
| Evidence / recording | Object listing, metadata, HTTP response and image evidence. Record actual result, tester, execution date, and defect ID in the case register. |

#### IT-08 — CSV API to queue to worker

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-UPLOAD-04–08; FR-ETL-01–06,13–18 / High |
| Preconditions and data | Real MongoDB/Redis/storage; approved dealer; fixture: one valid, one invalid and one active duplicate row. |
| Procedure | 1. Submit CSV. 2. Capture upload ID and stored original. 3. Observe queue and worker. 4. Poll terminal state. 5. Query listings/rejections. |
| Expected result | Accepted request creates a job linked to the dealer; 3 processed, 1 valid, 1 invalid rejection, 1 duplicate; final completedWithErrors; rejected rows retain source identity. |
| Execution status | Planned; not executed |
| Evidence / recording | Job events, preserved CSV, DB counters and rejected rows. Record actual result, tester, execution date, and defect ID in the case register. |

#### IT-09 — ZIP processing across real services

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-12–16; FR-UPLOAD-08 / High |
| Preconditions and data | Completed CSV import; ZIP contains matching plate folders and UNKNOWN-9999. |
| Procedure | 1. Submit ZIP for that upload. 2. Wait for image completion. 3. Inspect listing photos and unmatched folders. 4. Attempt as another dealer. |
| Expected result | Only that upload’s matching listings receive photos; unmatched folder reported; foreign access denied; photos render from storage. |
| Execution status | Planned; not executed |
| Evidence / recording | ZIP, upload result, object metadata and listing view. Record actual result, tester, execution date, and defect ID in the case register. |

#### IT-10 — Search service and database retrieval

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-SEARCH-01–20; FR-ETL-28 / High |
| Preconditions and data | Known catalogue including an older exact match among more than 300 records; fixed embedding mode. |
| Procedure | 1. Filter by category/price/location. 2. Submit natural-language and typo queries. 3. Switch sort and page. 4. Disable provider. |
| Expected result | Hard constraints hold across sort/page; known relevant matches are retrievable; fallback returns usable results without a server error. Judge ranked results against a pre-labelled query set. |
| Execution status | Planned; not executed |
| Evidence / recording | Seed manifest, result IDs, provider mode and timings. Record actual result, tester, execution date, and defect ID in the case register. |

#### IT-11 — Notifications, ownership and SMTP failure

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-NOTIFY-01–07 / High |
| Preconditions and data | Dealer A/B, admin, local mail sink or test inbox; completion/failure/review events. |
| Procedure | 1. Trigger events. 2. Check recipient/unread state. 3. Mark read. 4. Attempt foreign notification read. 5. Cause SMTP failure. |
| Expected result | Correct owner receives in-app summary; read count updates; foreign access denied; SMTP failure retains in-app notification and records failed email state. Resolve completion-email policy discrepancy before sign-off. |
| Execution status | Planned; not executed |
| Evidence / recording | Notification documents, API responses and captured mail. Record actual result, tester, execution date, and defect ID in the case register. |

#### IT-12 — Moderation and statistics

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ADMIN-02,04–06,09–10 / High |
| Preconditions and data | Admin; active/suspended users; 250 dealer listings with known status distribution. |
| Procedure | 1. Suspend/reactivate a user. 2. Archive a listing. 3. Query dashboard totals and paged inventory. 4. Inspect audit. |
| Expected result | Suspension blocks protected operations; moderation persists; totals cover all 250 records; pages expose full inventory; actor/time/resource audit exists. |
| Execution status | Planned; not executed |
| Evidence / recording | Counts, audit rows and access-control responses. Record actual result, tester, execution date, and defect ID in the case register. |

#### IT-13 — Concurrent duplicate creation

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ETL-19–22; RR-08 / High |
| Preconditions and data | Two simultaneous API/import requests using CAX-1234 and cax 1234. |
| Procedure | 1. Synchronize submission of both requests. 2. Repeat with manual create plus CSV import. 3. Inspect normalized active/draft identity. |
| Expected result | At most one reserving listing is created; conflicting request is reported as conflict or duplicate rejection; no silent double insertion. |
| Execution status | Planned; not executed |
| Evidence / recording | Concurrent request log and database aggregation. Record actual result, tester, execution date, and defect ID in the case register. |

#### IT-14 — Worker restart and replay

| Field | Test specification |
| --- | --- |
| Requirements / priority | RR-06–08; FR-ETL-31–32 / High |
| Preconditions and data | Multi-batch CSV; isolated worker and real dependencies. |
| Procedure | 1. Stop worker after a persisted batch. 2. Restart before lease expiry; observe queue result. 3. Repeat after lease expiry. 4. Replay a completed job. |
| Expected result | Abandoned work eventually resumes; no job is falsely acknowledged as complete; no duplicate rows; final counts match the original source. |
| Execution status | Planned; not executed |
| Evidence / recording | Worker/queue timeline, lease values and unique row counts. Record actual result, tester, execution date, and defect ID in the case register. |

#### IT-15 — Dependency health and recovery

| Field | Test specification |
| --- | --- |
| Requirements / priority | RR-09–10; FR-ADMIN-07–08 / High |
| Preconditions and data | Dedicated running test stack; no shared/demo services. |
| Procedure | 1. Check live/ready endpoints. 2. Disconnect test database. 3. Observe readiness and logs. 4. Restore database. |
| Expected result | Liveness describes process health; readiness returns 503 when database is unavailable and returns ready after recovery; logs diagnose failure without secrets. Queue/worker diagnostics are separately assessed. |
| Execution status | Planned; not executed |
| Evidence / recording | Timestamped health responses and sanitized logs. Record actual result, tester, execution date, and defect ID in the case register. |

#### IT-16 — Transient failures and lost queue publication

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ETL-03; RR-06–08 / High |
| Preconditions and data | Test storage/Redis fault injection; accepted upload record. |
| Procedure | 1. Fail storage download temporarily and restore it. 2. Fail queue publication after MongoDB job creation. 3. Inspect retry/reconciliation behavior. |
| Expected result | Recoverable work is retried or exposed for explicit recovery; no permanently invisible pending job; terminal failure has meaningful cause. |
| Execution status | Planned; not executed |
| Evidence / recording | Durable job state, queue state, attempts and recovery timeline. Record actual result, tester, execution date, and defect ID in the case register. |

### 3.4 End-to-End Testing

Execute these procedures through the actual browser and running test stack, using separate sessions for buyer, dealer and administrator. Capture screenshots, browser errors, correlated upload/listing IDs and final persisted results. Playwright is proposed for later automation [5]; manual execution is valid if the tester records all steps and evidence. No browser journey below has been executed for this report.

#### E2E-01 — Buyer registration and sign-in

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-USER-01–06A / High |
| Preconditions and data | Unused test email and existing buyer; test Firebase project. |
| Procedure | 1. Register with missing fields and mismatched passwords. 2. Register valid buyer. 3. Sign out/in. 4. Try wrong password and duplicate email. 5. Refresh protected page. |
| Expected result | Clear validation/authentication errors; one identity/profile for valid account; session and navigation behave correctly; no duplicate local account. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

#### E2E-02 — Dealer application and approval

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-09–13; FR-ADMIN-03,06 / High |
| Preconditions and data | Test applicant, documents and separate admin session. |
| Procedure | 1. Complete dealer registration/application. 2. Verify pending access restrictions. 3. Admin views documents and approves. 4. Applicant refreshes/signs in again. |
| Expected result | Pending application visible to admin; approval grants dealer portal and creates audit/notification; documents remain protected. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

#### E2E-03 — Application rejection and correction

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-11–13; proposed resubmission enhancement / High |
| Preconditions and data | Pending applicant and admin. |
| Procedure | 1. Reject with reason. 2. Applicant reads rejection. 3. Attempt correction/resubmission. |
| Expected result | Required rejection reason is visible and dealer access remains denied. Correction/resubmission is a proposed enhancement, currently blocked by existing-application check; report separately from mandatory rejection behavior. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

#### E2E-04 — Create, edit and publish a vehicle

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-01–05,07–16 / High |
| Preconditions and data | Approved dealer; unique valid car; two valid images; separate buyer session. |
| Procedure | 1. Create draft with photos. 2. Edit price and description. 3. Publish. 4. Buyer opens details. 5. Dealer removes one photo. 6. Buyer refreshes. |
| Expected result | Saved edits, correct dealer details and photos are visible; draft is not publicly browsable; removed image no longer appears. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

#### E2E-05 — Recover from partial photo failure

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-12–15; RR-08–09 / High |
| Preconditions and data | New vehicle; force second image request to fail after listing and first image save. |
| Procedure | 1. Submit form. 2. Observe failure. 3. Restore image service. 4. Retry using the visible workflow. 5. Inspect listings and photos. |
| Expected result | Exactly one listing remains; first image is not duplicated; missing image can be added without registration conflict; error clearly explains recovery. Known code-review risk: resubmit can call create again. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

#### E2E-06 — Bulk import, corrections and ZIP photos

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-UPLOAD-01–08; FR-ETL-13–22,31–33 / High |
| Preconditions and data | CSV with valid, invalid and duplicate rows; ZIP with matching and unmatched folders. |
| Procedure | 1. Download category template. 2. Upload mixed CSV. 3. Observe status/counters. 4. Read rejection reasons. 5. Correct and upload only rejected valid candidates. 6. Attach ZIP. 7. Inspect vehicle photos. |
| Expected result | Valid rows appear once; errors explain correction; original successful rows are not accidentally duplicated; unmatched folders visible; summary and notifications agree. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

#### E2E-07 — Buyer discovery and dealer contact

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-07–11,16; FR-SEARCH-01–20 / High |
| Preconditions and data | Seeded catalogue with known automatic SUV below LKR 2 million in Colombo plus distractors. |
| Procedure | 1. Browse marketplace. 2. Combine filters and natural-language query. 3. Try toyata corola. 4. Change sort/page. 5. Open details and dealer contact. 6. Try no-match query. |
| Expected result | Relevant fixtures appear while hard constraints hold; details match selected vehicle/dealer; pagination works; empty results have clear feedback. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

#### E2E-08 — Inventory actions and large inventory

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-05–08; FR-MARKET-05; UR-03 / High |
| Preconditions and data | Dealer with 250 seeded listings; known status counts. |
| Procedure | 1. Search and paginate inventory. 2. Publish draft. 3. Mark sold and archive. 4. Simulate one failed action. 5. Inspect counts and buyer results. |
| Expected result | All inventory is reachable; successful changes update counters; failed action shows feedback and preserves state; sold/archived listings leave active buyer results. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

#### E2E-09 — Administrator moderation and suspension

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-ADMIN-01–06,09–10; FR-USER-10–11 / High |
| Preconditions and data | Admin and active dealer in separate sessions. |
| Procedure | 1. Find dealer/user. 2. Suspend account. 3. Dealer attempts protected action. 4. Reactivate. 5. Archive listing. 6. Review audit and dashboard. |
| Expected result | Suspension is enforced by backend; reactivation restores allowed access; archive is visible; audit identifies actor/resource/action; unauthorized admin navigation is denied. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

#### E2E-10 — Notification centre and delivery status

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-NOTIFY-01–07 / High |
| Preconditions and data | Admin/dealer sessions, captured test email and generated review/import events. |
| Procedure | 1. Trigger approval and failed import. 2. Observe bell/count. 3. Open and mark read. 4. Reload. 5. Check delivery status and other user’s inbox. |
| Expected result | Correct recipient sees accurate persisted summary/read state; email status reflects delivery attempt; other inbox is isolated. Successful-import email expectation remains a documented SRS-policy decision. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

#### E2E-11 — Responsive, keyboard and failure states

| Field | Test specification |
| --- | --- |
| Requirements / priority | UR-01–04,09–12,16–18 / High |
| Preconditions and data | Desktop, tablet and mobile viewports; browser keyboard access. |
| Procedure | 1. Complete search and listing form at each viewport. 2. Navigate using Tab/Enter/Escape. 3. Trigger loading, empty and network-failure states. 4. Reload nested route. |
| Expected result | No essential clipped controls; forms have labels and useful errors; visible focus; pending actions controlled; nested route reload works. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

#### E2E-12 — Dealer public-profile update

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-DEALER-01–04 / High |
| Preconditions and data | Approved dealer and buyer session. |
| Procedure | 1. Locate dealer profile edit. 2. Change public phone/address/description. 3. Save. 4. Buyer refreshes listing dealer details. |
| Expected result | Authorized edits persist and public details update. Current route inspection found no dealer profile-update endpoint; treat as an implementation gap pending remediation, not a passed journey. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

### 3.5 Non-functional Test Cases

#### NF-01 — API and search response time

| Field | Test specification |
| --- | --- |
| Requirements / priority | PSR-01–03 / Medium |
| Preconditions and data | Known catalogue; defined expected-load stage; fixed provider configuration. |
| Procedure | 1. Warm up 2 minutes. 2. Run normal API and structured/semantic search requests for 10 minutes. 3. Repeat three runs. 4. Save per-request durations and errors. |
| Expected result | Normal API p95 ≤2 seconds; structured search ≤2 seconds under expected conditions; semantic search normally ≤5 seconds, with provider exceptions identified, not hidden. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

#### NF-02 — 5,000-row ETL throughput

| Field | Test specification |
| --- | --- |
| Requirements / priority | PSR-04–06 / Medium |
| Preconditions and data | 5,000 unique valid rows; recorded CPU/RAM, batch size and embedding/enrichment mode. |
| Procedure | 1. Submit import. 2. Time accepted upload to final persisted completion. 3. Browse/search concurrently. 4. Count records. |
| Expected result | Approximately 5,000 records processed within 120 seconds in the defined environment; all records accounted for; normal API remains responsive. Report upload transfer time separately. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

#### NF-03 — Concurrent load and resource stability

| Field | Test specification |
| --- | --- |
| Requirements / priority | PSR-01,06–07 / Medium |
| Preconditions and data | Dedicated stack; seeded catalogue; workload profile from 3.1.5. |
| Procedure | 1. Run 5, 20 and 50 client stages. 2. Capture latency/errors/CPU/memory/queue depth. 3. Observe recovery after load removal. |
| Expected result | Expected-load stage meets agreed thresholds; no unexplained data loss or unbounded queue/memory growth; overload behavior and limits are reported. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

#### NF-04 — Upload boundaries and archive expansion

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-MARKET-13; PSR-13–14 / Medium |
| Preconditions and data | Files at configured limit minus 1 byte, exact limit and plus 1 byte; spoofed image; high-expansion ZIP; many entries. |
| Procedure | 1. Upload each boundary file. 2. Submit spoofed image and expanded-size archive. 3. Monitor process memory and persisted results. |
| Expected result | Valid limits follow configuration; invalid/oversize content rejected; expanded-byte/entry budget stops unsafe work; no unexpected server crash. Record actual configured limits before execution. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

#### NF-05 — Build, configuration and browser smoke

| Field | Test specification |
| --- | --- |
| Requirements / priority | SRS 2.4; PSR-10,12 / Medium |
| Preconditions and data | Locked dependencies; example configuration; selected browsers. |
| Procedure | 1. Build all workspaces. 2. Validate Compose without printing secrets. 3. Verify CORS, image URLs, HTTPS in deployment and nested routes. 4. Record browser versions. |
| Expected result | Every selected environment builds and completes smoke flows; secrets remain outside browser output/logs. Build portion passed; remaining checks not executed. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

#### NF-06 — Search relevance and fallback quality

| Field | Test specification |
| --- | --- |
| Requirements / priority | FR-SEARCH-08–20 / Medium |
| Preconditions and data | Twenty manually judged queries; exact/typo/natural-language/no-match fixtures; catalogue over 300 records. |
| Procedure | 1. Record expected matches before execution. 2. Search in provider-enabled and fallback modes. 3. Inspect top five and sorted results. |
| Expected result | Hard constraints always hold; expected exact matches remain retrievable; record precision@5 and misses. Proposed relevance target: expected known match in top five for at least 18/20 labelled queries; team approval pending. |
| Execution status | Planned; not executed |
| Evidence / recording | No execution evidence yet. Record actual result, tester, execution date, and defect ID in the case register. |

### 3.6 Environment, Data and Execution

| Environment | Configuration / purpose |
| --- | --- |
| Observed automated run | Windows-10-10.0.26200-SP0; Node v22.19.0; Vitest 4.1.10; baseline d57b9cc7. Exact timestamps are in JSON and run-metadata.json. |
| Unit/component | Installed npm workspace dependencies; mock worker storage/repos/notifications; no real database required for selected test files. |
| Integration target | Disposable MongoDB 7 replica set rs0; dedicated Redis; MinIO test bucket; backend and worker configured only for that environment. |
| End-to-end target | Same isolated service stack plus frontend, separate test Firebase project or explicitly configured emulator, and captured test SMTP delivery. |
| Browser matrix | Record installed Chrome, Edge and Firefox versions; Safari on an available Apple device. Desktop 1440×900, tablet 768×1024, mobile 390×844. |
| Performance target | Record host CPU, allocated RAM, container limits, network, dataset size, embedding model/mode and batch size. These are not established by the current unit run. |

The Firebase emulator is an optional planned setup [7], not a current repository capability claim. Configure both frontend and Admin SDK explicitly if using it. For final Firebase-integration acceptance, run at least one smoke journey with a dedicated real test project. Deliver emails only to the team’s test mail sink or designated test accounts.

| Fixture | Required contents |
| --- | --- |
| Accounts | One admin; one active buyer; two approved dealers A/B; one pending and one rejected applicant; one suspended account. Use synthetic details. |
| Small catalogue | One valid example for car, motorcycle, van, truck, three-wheeler and bus; petrol/hybrid/electric variants; draft/active/sold/archived states. |
| CSV examples | Valid 3-row file; mixed valid/invalid/duplicate file; missing header; malformed row; blank mandatory field; category mismatch; numeric boundary cases. |
| Images and archives | Valid JPEG/PNG/WebP; spoofed/oversize image; ZIP folders named by plate; backslash/slash paths; unknown folder; excessive expansion fixture. |
| Large catalogue | 250 dealer listings for inventory totals/pagination; >300 search candidates including older relevant records; 5,000 unique valid import rows. |
| Fixture governance | Use deterministic registration numbers and a run ID; reset only that run’s isolated data. Store fixture checksum, seed script version and expected counts with the run. Fixtures described here are a plan, not files generated by this report. |

Commands below are reproducible execution instructions. On PowerShell use npm.cmd. The first two commands were executed successfully and generated the attached JSON evidence:

```powershell
npm.cmd test --workspace @motorx/backend -- --exclude "**/*.repository.test.ts" --reporter=json --outputFile=../../docs/test-evidence/backend-unit-results.json
npm.cmd test --workspace @motorx/worker -- --reporter=json --outputFile=../../docs/test-evidence/worker-results.json
npm.cmd run build --workspaces --if-present
```

For database integration, first provision an isolated replica set with no application data, wait for an elected primary, then set the explicit test URI. The following command was not executed in this report run:

```powershell
$env:TEST_MONGODB_URI = "mongodb://127.0.0.1:27017/motorx_test?replicaSet=rs0"
npm.cmd test --workspace @motorx/backend -- --maxWorkers=1
```

The existing compose.test.yml is a test override, not a standalone E2E deployment. Its backend and worker commands run test suites rather than long-lived application services. Use a separate reviewed E2E configuration that runs the app, with unique project/network/ports and isolated database/storage. Do not apply the override to a running shared demonstration stack. Docker access in this environment was denied, so service provisioning and database integration execution remain pending.

For proposed browser automation, implement the E2E procedures as Playwright tests, configure base URL/test identities and capture traces on failure before adding an E2E command to CI. No npm E2E script is currently available. Manual execution can proceed once the dedicated stack is ready.

### 3.7 Entry, Exit and Suspension Criteria

| Gate | Criteria |
| --- | --- |
| Entry | Baseline commit recorded; dependencies installed; builds pass; expected behavior agreed; test identities/fixtures available; isolated database/queue/storage verified; replica-set primary ready for transaction tests. |
| Per-case pass | All stated expected outcomes observed and evidence linked. A partial run, unavailable dependency or unimplemented feature cannot be marked passed. |
| Exit / submission recommendation | All critical security/ownership/data-integrity and essential E2E journeys executed and passed; all existing automated suites including repositories pass; no open critical/high defects; lower-risk exceptions documented and accepted by the team; required performance evidence captured or explicitly listed as an unmet acceptance item. |
| Suspend | Wrong database/storage target, unreliable fixtures, unavailable critical dependency, suspected corruption or build that cannot support the next test level. |
| Resume | Cause corrected; target isolation rechecked; fixtures restored; smoke test passes; rerun affected cases before resuming remaining work. |

Defect severity: Critical = unauthorized access or significant data loss; High = essential journey blocked or incorrect inventory state; Medium = degraded workflow with a workaround; Low = minor presentation issue. Log baseline, case ID, preconditions, steps, expected/actual results, evidence and severity. Retest the fix and adjacent flows before closing. Release acceptance is a team decision; it is not granted by this report.

### 3.8 Responsibilities and Schedule

| Owner role | Proposed responsibility |
| --- | --- |
| M1 — Auth/Dealers/Marketplace | Unit and API checks for ownership, applications, listing edits/images; execute buyer and dealer journeys. |
| M2 — Inventory/ETL | CSV/ZIP fixtures, worker integration, retry/replay, counters, import throughput and failure evidence. |
| M3 — Search/Notifications/Admin | Search relevance/latency, notifications, moderation, audit, dashboard and diagnostics. |
| Cross-reviewer | A different member reviews expected results and reruns critical cases after fixes. |
| Group 23 / supervisor | Agree workload, resolve requirement discrepancies, review known defects and record submission acceptance. |

These roles follow the repository team work plan; personal names and approval signatures have not been invented. The following is a proposed sequence relative to the submission date, not a confirmed calendar commitment.

| When | Activity | Exit artifact |
| --- | --- | --- |
| T−5 days | Confirm baseline, environment and fixtures; run unit/component tests. | JSON results and reviewed case register |
| T−4 days | Execute repository/API/queue/storage integration; triage failures. | Integration logs and defect list |
| T−3 days | Execute essential browser journeys and responsive checks. | Screenshots/traces and E2E results |
| T−2 days | Run load/recovery checks; fix and retest high-impact failures. | Performance and recovery evidence |
| T−1 day | Full regression, clean demo rehearsal and team review. | Final evaluation summary and acceptance record |

## 4. Deliverables

| Deliverable | Location / status |
| --- | --- |
| Master test plan | docs/MotorX_Test_Plan_Report.docx; editable Word report based on supplied template sections. |
| Readable source | docs/MotorX_Test_Plan_Report.md; same report content for repository review. |
| Case register | docs/MotorX_Test_Case_Register.csv; case IDs, requirements, procedures, expected/actual results, status and evidence fields. |
| Executed assertion register | docs/test-evidence/automated-test-register.csv; 77 individual test outcomes. |
| Machine-readable execution evidence | docs/test-evidence/backend-unit-results.json and worker-results.json. |
| Build and baseline evidence | docs/test-evidence/build-output.txt and run-metadata.json. |
| Future execution artifacts | Integration logs, browser screenshots/traces, performance measurements, fixture manifests, defect records and team sign-off remain to be produced. |

### 4.1 Test Evaluation Summaries

| Evaluation item | Observed result | Interpretation |
| --- | --- | --- |
| Backend unit/helper/schema suites | 8 files; 42 passed; 0 failed. | Includes image signature checks in addition to the earlier selected 40-test review. |
| Worker unit/component suites | 6 files; 35 passed; 0 failed. | Pipeline functions and mocked service orchestration; no real queue/storage/database proof. |
| Combined executed automated cases | 77 passed; 0 failed. | 100% pass rate for the executed subset only. |
| Workspace build | Backend, frontend, worker and shared-contracts build passed. | Compilation/bundling check, not a functional test. |
| Existing repository integration cases | 3 files / 6 cases; not executed in this run. | Docker daemon access denied; no test database was provisioned by this task. |
| Browser E2E | Not executed. | No existing automated browser suite; planned procedures supplied. |
| Performance, load, recovery and device campaign | Not executed except build portion of configuration checks. | No latency, capacity, availability or cross-browser compliance claim. |
| Frontend/shared-contracts package test scripts | Placeholder echo commands. | Do not count them as passed tests or coverage. |

Assessment: the selected automated baseline is green. Overall submission acceptance remains pending because real-service integration, essential browser journeys and required non-functional measurements have not been evidenced. Produce a short evaluation summary after each test session and a final summary before submission, listing baseline, run scope, counts, blocked cases, defects, residual risks and acceptance decision.

| Review finding | Implication / follow-up |
| --- | --- |
| Photo retry in ListingForm.tsx | Saved ID is stored but create/update selection still uses route listingId; a retry after create can call create again. Validate E2E-05 and correct recovery. Code-review finding, not an executed failure. |
| Inventory action feedback | ListingManager status/delete handlers lack visible catch/pending feedback and do not invalidate my-listing-stats. Validate E2E-08. |
| Dealer profile / rejected resubmission | Dealer routes expose application submission and retrieval, but no profile update; service rejects existing applications. FR-DEALER-03 is an acceptance gap; resubmission is an enhancement. |
| Completion email policy | SRS FR-NOTIFY-06 includes inventory completion email; README delivery matrix marks clean CSV/ZIP completion as no email. Obtain team resolution and test the agreed policy; do not hide the difference. |
| Diagnostics scope | SRS FR-ADMIN-08 expects backend/database/queue/worker status. Database readiness alone does not establish complete diagnostic coverage. Assess separately in IT-15. |

### 4.2 Reporting on Test Coverage

Maintain requirement → case → result → evidence → defect links in the case register. The matrix below is a high-level map of planned coverage, not a claim that every individual SRS clause is completely tested. Expand compound requirements into individual rows before final sign-off. Code line/branch coverage was not collected; no percentage is asserted.

| Requirement area | Case mapping | Current coverage evidence |
| --- | --- | --- |
| FR-USER-01–12 / PSR-08–09 | IT-04; E2E-01,02,09 | Integration/E2E pending; no direct auth middleware suite in executed subset. |
| FR-DEALER-01–13 | UT dealer validation; IT-01,02,05,12; E2E-02,03,08,12 | Schema assertions pass; repositories pending; profile update gap. |
| FR-MARKET-01–16 | UT listing/image rules; IT-06,07,09; E2E-04,05,07,08 | Local validation/signatures pass; persistence/browser evidence pending. |
| FR-UPLOAD-01–08 | UT upload validation; IT-08,09; E2E-06 | File/header checks pass; real service chain pending. |
| FR-ETL-01–33 / RR-02–08 | UT extraction/normalization/validation/transformation/orchestration; IT-03,08,13,14,16; NF-02 | Mocked/local assertions pass; queue/recovery/throughput pending. |
| FR-SEARCH-01–20 | UT query/embedding helpers; IT-10; E2E-07; NF-01,06 | Query helpers pass; ranking, dataset retrieval and latency pending. |
| FR-NOTIFY-01–07 | IT-11; E2E-10 | Planned; policy discrepancy recorded. |
| FR-ADMIN-01–10 | UT admin validation; IT-02,05,12,15; E2E-09 | Schema checks pass; audit, moderation and diagnostics pending. |
| UR-01–18 | E2E-01,06,07,08,11; user walkthrough | Planned; learning/documentation observations still needed for UR-13–15. |
| PSR-01–07 / RR-01 | NF-01–03; IT-14–16; production monitoring for availability | Performance and recovery pending; monthly availability cannot be established by this run. |
| PSR-10–16 / RR-09–10 | IT-04,07,09,15; NF-04,05 | Some input checks pass; deployed HTTPS/secret/logging/access evidence pending. |

Execution pass rate = passed / executed. Blocked and not-run cases are reported separately and must not inflate the pass rate. Requirement coverage = individually reviewed requirements with linked cases / agreed in-scope requirements; publish only after completing the clause-level matrix. Treat a UT group and its individual assertions as two reporting views, never as additive test counts.

## 5. Risks, Dependencies, Assumptions, and Constraints

| Risk / likelihood / impact | Mitigation strategy | Contingency |
| --- | --- | --- |
| Shared database cleanup / Medium / Critical | Explicit disposable TEST_MONGODB_URI; validate target; serial repository execution; isolated stack. | Stop execution, preserve logs, verify target and restore only approved test fixtures. |
| Docker access unavailable / Observed / High | Arrange execution on team workstation or CI with a ready isolated replica set. | Keep integration cases not run; retain unit evidence; rerun when infrastructure is available. |
| Mock-only confidence / High / High | Pair worker component checks with IT-08,09,14,16 using real services. | Do not accept recovery or delivery claims from mocked results. |
| Firebase/SMTP/model quota or outage / Medium / High | Dedicated test accounts, captured mail and deterministic model mode; record provider state. | Use local substitutes for internal tests; repeat real-provider smoke when available and report limitation. |
| Inadequate fixtures / Medium / High | Include six categories, powertrain variants, duplicates, >300 search entries and known expected counts. | Repair fixture manifest and rerun affected cases; do not change expected results to match a defect. |
| Concurrent test cleanup / Medium / High | Run repository tests serially or provide a unique database per worker/run. | Reset isolated dataset and rerun; diagnose false failures before filing product defect. |
| SRS/code/document disagreement / High / High | Trace to SRS; record email/profile/diagnostic gaps; obtain team scope decision. | Mark unmet requirements or accepted exceptions explicitly in final evaluation. |
| Time before submission / Medium / High | Prioritize security, inventory integrity and essential E2E; reserve regression time. | Document unexecuted work and residual risk; avoid adding unverified features. |
| Unstable performance baseline / Medium / Medium | Record hardware/provider/network, warm-up, sample sizes and failed requests. | Repeat comparable runs; report environment-bound results without generalizing. |
| Sensitive test artifacts / Medium / High | Synthetic data; redact tokens, credentials and personal verification documents. | Remove restricted artifacts from submission package and regenerate sanitized evidence. |

Dependencies: installed locked npm packages; database replica-set support; separate object storage and queue; test identities; working network for real provider smoke; reviewer availability. Assumptions: team ownership follows M1/M2/M3 in team-work-plan.md; proposed schedule and workload are subject to team agreement. Constraints: no existing browser automation, no direct shared-contracts/frontend test suites, no full line/branch coverage measurement, and no live-service integration execution in this environment.

## 6. References

[1] Group 23, “MotorX Software Requirements Specification,” v1.0, 9 Aug. 2026. Repository file: Gropu23_SRS.pdf, sections 2–5. Reviewed 21 Sep. 2026.

[2] Group 23, “MotorX Software Architecture Document.” Repository file: Group23_SAD.pdf. Reviewed 21 Sep. 2026.

[3] Group 23, MotorX source repository, baseline d57b9cc714a2634f0e16c210589d5f236471f841. README.md; team-work-plan.md; .github/workflows/ci.yml; compose.test.yml; apps/backend/src; apps/worker/src; apps/frontend/src. Reviewed 21 Sep. 2026.

[4] Vitest, “Getting Started.” https://vitest.dev/guide/ (accessed 21 Sep. 2026). Tool reference only; execution version in this report is 4.1.10 from the installed project.

[5] Microsoft, “Playwright — Installation.” https://playwright.dev/docs/intro (accessed 21 Sep. 2026). Proposed browser automation, not an executed MotorX suite.

[6] Docker, “Docker Compose.” https://docs.docker.com/compose/ (accessed 21 Sep. 2026). Multi-service test-environment reference.

[7] Google, “Introduction to Firebase Local Emulator Suite.” https://firebase.google.com/docs/emulator-suite (accessed 21 Sep. 2026). Optional isolated identity-testing reference.

[8] Supplied “6 Template for Test plan.docx,” Rational Unified Process-style master test-plan template. Six-section structure and testing-technique fields adapted for MotorX; reviewed 21 Sep. 2026.

[9] MotorX automated execution artifacts, 21 Sep. 2026: docs/test-evidence/backend-unit-results.json; worker-results.json; automated-test-register.csv; build-output.txt; run-metadata.json.
