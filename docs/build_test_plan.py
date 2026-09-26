"""Generate the submission test plan, its case register and the executed-test register from the
recorded evidence in docs/test-evidence. Run from the repository root:  python docs/build_test_plan.py"""
from pathlib import Path
import csv
import json
from datetime import datetime, timezone
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs'
EVIDENCE = OUT / 'test-evidence'
VERSION, DATE, DATE_SHORT = '2.0', '26 September 2026', '26 Sep 2026'
blocks, cases = [], []


def h(text, level=1): blocks.append(('h', level, text))
def p(text): blocks.append(('p', text))
def table(headers, rows, widths=None): blocks.append(('table', headers, rows, widths))
def code(text): blocks.append(('code', text))


def case(id, title, refs, pre, steps, expected, status, evidence, priority='High', actual='Not recorded', tester='Unassigned', executed='Not executed'):
    cases.append(dict(ID=id, Title=title, Level=id.split('-')[0], Requirements=refs, Priority=priority, Preconditions=pre, Steps=steps,
                      Expected=expected, Status=status, Evidence=evidence, Actual=actual, Tester=tester, ExecutedAt=executed, Defect='None recorded'))
    h(f'{id} — {title}', 3)
    table(['Field', 'Test specification'], [
        ['Requirements / priority', f'{refs} / {priority}'], ['Preconditions and data', pre], ['Procedure', steps],
        ['Expected result', expected], ['Execution status', status], ['Evidence', evidence]])


# ---------------------------------------------------------------- recorded evidence
def load(name):
    return json.loads((EVIDENCE / name).read_text(encoding='utf-8'))


reports = {'backend': load('backend-results.json'), 'worker': load('worker-results.json'), 'frontend': load('frontend-results.json')}
smoke = load('live-smoke-results.json')
meta = load('run-metadata.json')
assert (reports['backend']['numPassedTests'], reports['backend']['numTotalTests']) == (147, 147)
assert (reports['worker']['numPassedTests'], reports['worker']['numTotalTests']) == (94, 94)
assert (reports['frontend']['numPassedTests'], reports['frontend']['numTotalTests']) == (50, 50)
TOTAL = sum(r['numTotalTests'] for r in reports.values())

suites = {}
for workspace, report in reports.items():
    for suite in report['testResults']:
        rel = suite['name'].replace('\\', '/')
        rel = 'apps/' + workspace + '/' + rel[rel.find('src/'):]
        suites[rel] = (workspace, suite)


def executed(rel):
    workspace, suite = suites[rel]
    n = len(suite['assertionResults'])
    passed = sum(a['status'] == 'passed' for a in suite['assertionResults'])
    when = datetime.fromtimestamp(suite['startTime'] / 1000, tz=timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    return n, passed, when, f'{workspace}-results.json'


automated_rows = []


def automated_case(id, rel, title, refs, pre, steps, expected, priority='High'):
    n, passed, when, report_name = executed(rel)
    status = f'Executed {DATE_SHORT}: {passed}/{n} passed'
    case(id, title, refs, pre, steps, expected, status, f'{rel}; test-evidence/{report_name}', priority,
         actual=f'{passed} passed; {n - passed} failed', tester='Automated Vitest runner', executed=when)
    for k, a in enumerate(suites[rel][1]['assertionResults'], 1):
        automated_rows.append({'ID': f'{id}.{k:02}', 'Group': id, 'Level': id.split('-')[0], 'File': rel, 'Test': a['fullName'],
                               'Status': a['status'], 'DurationMs': round(a.get('duration') or 0, 1), 'Evidence': report_name})
    return n


# ---------------------------------------------------------------- front matter
h('Document control')
table(['Item', 'Value'], [
    ['Project', 'MotorX — Second-Hand Vehicle Marketplace with Intelligent Search and Automated Inventory Processing'],
    ['Document', 'Master Test Plan and Test Evaluation Report'],
    ['Version / date', f'{VERSION} / {DATE}'],
    ['Prepared for', 'Group 23 — final submission'],
    ['Baseline', f"{meta['revision']} ({meta['workingTree']})"],
    ['Status', f'{TOTAL} automated unit, integration and system tests executed and passed; live-stack smoke executed; browser end-to-end journeys specified for manual execution by the team.'],
    ['Template', '6 Template for Test plan.docx (Rational Unified Process). Its six main sections and eight technique categories are kept; Sections 3.2–3.8 add the MotorX test cases by level.'],
    ['Approval', 'Project team / supervisor review pending; no approval is implied by this report.']])
h('Revision History')
table(['Date', 'Version', 'Description', 'Author'], [
    ['21 Sep 2026', '1.0', 'Initial MotorX plan, case register and 77-test automated baseline; integration and end-to-end work planned.', 'Group 23'],
    [DATE_SHORT, VERSION, f'Re-executed all suites ({TOTAL} tests, all passing) on Node 24 against a real MongoDB replica set, Redis and MinIO. Added HTTP journey integration tests, frontend component tests, the 5,000-record benchmark, the worker crash drill and a live-stack smoke test. Covered new features: mobile layouts, Sinhala/Tamil, similar vehicles, recommendations, compare, stale-stock tools, bulk actions and small photo copies. Merged main (version4) and retested: {TOTAL} tests passing. Updated findings, coverage and risks.', 'Group 23']],
    widths=[0.9, 0.55, 4.25, 1.15])
h('Table of Contents')
for item in ['1. Evaluation Mission and Test Motivation', '2. Target Test Items', '3. Test Approach', '3.1 Testing Techniques and Types',
             '3.2 Unit and Component Testing', '3.3 Integration Testing', '3.4 End-to-End Testing', '3.5 Non-functional Test Cases',
             '3.6 Environment, Data and Execution', '3.7 Entry, Exit and Suspension Criteria', '3.8 Responsibilities and Schedule',
             '4. Deliverables', '4.1 Test Evaluation Summaries', '4.2 Reporting on Test Coverage',
             '5. Risks, Dependencies, Assumptions, and Constraints', '6. References']:
    p(item)
p('Navigation: section headings appear in Word’s Navigation Pane. The contents list deliberately omits page numbers so it stays valid after editing.')

# ---------------------------------------------------------------- 1
h('1. Evaluation Mission and Test Motivation')
p('MotorX connects buyers with dealer-owned second-hand vehicles and removes manual inventory entry through category-specific CSV imports, background processing and ZIP photo attachment. A React/TypeScript interface (with English, Sinhala and Tamil text) calls an Express modular backend; a separate worker processes BullMQ jobs, sends queued emails and runs scheduled maintenance. MongoDB stores application records, Redis backs the queue and rate limits, S3-compatible storage holds files, and Firebase provides authentication. Search combines structured filters with lexical and semantic ranking. [1]–[3]')
p('Mission: establish, with evidence, whether the submission build supports the essential buyer, dealer and administrator journeys; keeps each dealer’s data private; never loses or duplicates inventory, including when a worker crashes mid-import; and meets the measurable SRS targets. Testing concentrates on the failures that matter most for a marketplace: unauthorized access, lost or duplicated listings, incorrect search results, stale stock shown as available, and visible failures during the demonstration.')
p(f'This version is both the test plan and the evaluation report for the submission build. {TOTAL} automated tests were executed for it and all passed (backend 147, worker 94, frontend 50). A read-only smoke test also ran against the live application and real data. Browser journeys are fully specified in Section 3.4 but, at the time of writing, have not been executed by a person; they are reported as not executed, never as passed. A planned case is not a passed test.')
p('Source priority: the SRS defines required behavior; the source code at the baseline commit is the implementation under test; the supplied Word template defines the report structure. Features beyond the SRS (mobile layouts, languages, recommendations, compare, stale-stock and bulk tools) are labelled “Extension” and tested to the same standard. Differences between the SRS and the implementation are recorded as findings instead of redefining expected results.')

# ---------------------------------------------------------------- 2
h('2. Target Test Items')
table(['Target', 'Scope and interfaces', 'Priority'], [
    ['Authentication and users', 'Firebase sign-in, token verification and cache, local profile, buyer/dealer/admin roles, suspension, email verification before approval, per-account cache clearing.', 'Critical'],
    ['Dealer management', 'Application with documents (content-checked), pending/approved/rejected states, resubmission after rejection, approval audit, public profile editing, document retention.', 'High'],
    ['Marketplace', 'Category-aware create/edit, lifecycle (draft/active/sold/archived), photo upload with re-encoding and small copies, buyer details, suspended-dealer hiding.', 'Critical'],
    ['Inventory and ETL', 'CSV templates, upload acceptance when Redis is down, BullMQ, validation, normalization, duplicates, rejected rows, counters, leases, checkpoints, retries, reaper, ZIP photos.', 'Critical'],
    ['Dealer inventory tools (Extension)', 'Bulk publish / mark sold / archive / confirm / reduce price / delete; publish all drafts of one upload; stale-stock list, counts and weekly reminder.', 'High'],
    ['Search and discovery', 'Filters, natural-language extraction, typo correction, ranking, fallback; similar vehicles, recommendations from recently viewed vehicles, side-by-side compare (Extension).', 'High'],
    ['Administration and notifications', 'Review, moderation, account status, audit with date filters, dashboard, upload monitoring, scoped inbox, email outbox with retries.', 'High'],
    ['Frontend experience (Extension)', 'Responsive layouts and mobile navigation, filter sheet, swipe gallery, contact bar with WhatsApp, card tables on phones, Sinhala/Tamil switching.', 'High'],
    ['Security controls', 'Rate limits and upload concurrency gate, document and image sanitization, storage prefix isolation, secrets scanning and image vulnerability scanning in CI.', 'High'],
    ['Deployment and dependencies', 'Workspace builds on Node 24, Docker images, Compose (dev and isolated test project), MongoDB replica set, Redis, MinIO, health endpoints, CI pipeline.', 'High'],
    ['Client environments', 'Desktop and mobile/tablet widths in Chrome/Edge/Firefox; Safari where a device is available.', 'Medium']], widths=[1.6, 4.35, 0.9])
p('Outside this campaign: payments, financing and chat (not implemented); penetration testing of Firebase, Atlas and AWS themselves; physical hardware failure; proof of monthly availability from short test runs; production CloudFront configuration. Missing SRS behavior stays visible as a finding, not an exclusion.')

# ---------------------------------------------------------------- 3
h('3. Test Approach')
p('Testing runs bottom-up: fast unit and component tests on every change; integration tests against real MongoDB, Redis and object storage; HTTP journey tests that drive the real Express application and database end to end; system-level drills and a smoke test on running stacks; and finally browser journeys performed by a person. Techniques used: equivalence partitioning, boundary values, negative inputs, state-transition testing, two-dealer ownership checks, fault injection (killed worker, Redis down, storage errors) and before/after database inspection. A 200 response alone never counts as a pass; each case checks the persisted state or the visible result.')
table(['Level', 'What it crosses', 'Tests', 'Result'], [
    ['Unit / component', 'One function, schema, service or React component; databases, queues, storage and network replaced by fakes (jsdom for the frontend).', '234 in 41 files', 'Executed: 234/234 passed'],
    ['Integration — data', 'Repository, service and migration code against a real MongoDB 7 replica set; rate limits against real Redis.', '24 in 8 files', 'Executed: 24/24 passed'],
    ['Integration — HTTP journeys', 'Real Express app, middleware, services and MongoDB through HTTP (supertest). Only Firebase token checks and S3 calls are replaced, because they are external services.', '32 in 3 files', 'Executed: 32/32 passed'],
    ['Performance', 'Real CSV pipeline, MongoDB and MinIO with 5,000 rows.', '1', 'Executed: passed (11.2 s)'],
    ['End-to-end — system', 'Running containers: worker crash drill (60,000 rows) and read-only smoke of the live dev stack with real data.', '2 procedures', 'Executed: drill passed; smoke 16 passed, 1 failed (F-01)'],
    ['End-to-end — browser', 'A person using the real frontend, Firebase, backend, worker and storage.', '15 journeys', 'Specified; not executed at the time of writing']],
    widths=[1.35, 3.1, 1.0, 1.4])
p('Test doubles are used deliberately and stated per case. The HTTP journey tests replace the Firebase Admin SDK (token verification) and the S3 client, so they prove the application’s own authorization, validation and database behavior, not Firebase or AWS themselves; those are covered by the live smoke test and the browser journeys. The worker test named “end to end” in transform.test.ts checks one batch transformation locally and is counted as a unit test.')

h('3.1 Testing Techniques and Types', 2)
techniques = [
    ('3.1.1 Data and Database Integrity Testing', 'Keep listings, ownership, upload lineage, counters and duplicate rules correct, including under retries, crashes and concurrent requests.',
     'Real MongoDB replica set: repository tests; lease and idempotency tests (jobSafety.db); HTTP journeys that inspect documents after each request; the 60,000-row crash drill; the unique partial index on normalized registration numbers.',
     'Exact document counts, one listing per CSV row, one rejected record per bad row, unchanged foreign documents, audit rows written in the same transaction as the change.',
     'Vitest, Mongoose, supertest, MongoDB 7 replica set (compose project motorx-test), mongosh for inspection.',
     'Achieved: all 24 data-integration tests and 32 journeys pass; the crash drill finished with 60,000 listings from 60,000 distinct rows and no duplicates.',
     'Tests refuse to run unless TEST_MONGODB_URI names a motorx_test database on a local host (db.safety tests). Run with --maxWorkers=1 because suites clear shared collections.'),
    ('3.1.2 Function Testing', 'Verify buyer, dealer and administrator business rules with valid, invalid and boundary inputs.',
     'Unit tests for rules and schemas; HTTP journeys for complete use cases (apply → reject → resubmit → approve; bulk publish; stale detection; similar/recommended vehicles); browser journeys for the user’s view.',
     'SRS requirements, shared Zod schemas, status codes and error format, final database state, visible messages.',
     'Vitest, supertest, Testing Library; manual browser execution (Playwright proposed for later automation [5]).',
     'Achieved for automated levels (all pass). Browser journeys pending manual execution.',
     'An implemented behavior is never marked as meeting an SRS clause it does not cover; gaps are listed in Section 4.1.'),
    ('3.1.3 User Interface Testing', 'Verify navigation, accessible forms and usable layouts on phones, tablets and desktops, in English, Sinhala and Tamil.',
     'Component tests in jsdom (drawer menu, focus handling, card tables, swipe gallery, contact bar, compare, language switching, listing manager); manual checks at 360, 390, 768 and 1440 px with keyboard only; Lighthouse mobile audit.',
     'Menu reachable at every width; focus moves into and out of drawers and dialogs; labels on all fields; 16 px inputs on phones; 44 px touch targets; no horizontal page scroll; every English message has a Sinhala and a Tamil translation with the same placeholders.',
     'Vitest + Testing Library + jsdom; Chrome DevTools device mode; Lighthouse; physical phone where available.',
     'Achieved for component tests (50/50). Visual checks, Lighthouse scores and native-speaker review of translations pending.',
     'jsdom does not render CSS, so layout at each width must be confirmed in a real browser (E2E-12). Device emulation is not proof of physical-device behavior.'),
    ('3.1.4 Performance Profiling', 'Measure API/search latency and ETL throughput against PSR-01–06.',
     'Benchmark: import 5,000 generated rows through the real pipeline and time it. Smoke test: record response times of key endpoints on the live stack. Planned: k6 run with percentiles.',
     'PSR-01: 95% of normal requests within 2 s. PSR-02: structured search within 2 s. PSR-03: semantic search normally within 5 s. PSR-05: about 5,000 records within 2 minutes.',
     'Vitest benchmark (RUN_BENCHMARKS=1), smoke script timings, container metrics; k6 proposed.',
     'PSR-05 met: 5,000 records in 11.1–11.2 s (≈450 records/s) in two consecutive runs. Smoke timings (single requests, 3–868 ms) are indicative only, not a percentile measurement.',
     'Record hardware, dataset and embedding mode with each result. Local numbers do not predict Atlas or AWS latency.'),
    ('3.1.5 Load Testing', 'Verify the system stays responsive with many buyers browsing while imports run.',
     'Planned: 5, 20 then 50 concurrent virtual users for 10 minutes each after a 2-minute warm-up; mix 70% browse, 20% search, 10% details; one 5,000-row import running alongside.',
     'Latency percentiles, error rate, queue depth, memory, final record counts.',
     'k6 (proposed), container metrics.',
     'Not executed. Proposed target: SRS latency at the agreed normal-load stage and under 1% server errors.',
     'Run only on an isolated stack; rate limits must be raised or the load generator allow-listed, otherwise the test measures the limiter.'),
    ('3.1.6 Security and Access Control Testing', 'Verify authentication, roles, ownership, input handling and protection of private files.',
     'HTTP journeys with a second dealer changing IDs, wrong roles, missing tokens and suspended accounts; unit tests for token caching and revocation, document sanitization (PDF scripts, launch actions, embedded files, renamed executables), image re-encoding (EXIF/GPS removal, pixel cap, hidden data), rate limits and upload concurrency; CI secret scanning (Gitleaks) and image scanning (Trivy); npm audit.',
     '401 without a valid token; 403 for the wrong role or a suspended account; 404 for another dealer’s resources with no change made; private storage objects never served publicly; 429 when limits are exceeded.',
     'supertest, Vitest, Gitleaks, Trivy, npm audit.',
     'Achieved for all automated cases (10 access-control journeys plus security unit tests pass). Smoke test confirmed 401 on dealer and admin routes of the live stack.',
     'Firebase verification itself is replaced in journeys; the live smoke and browser journeys cover real tokens. No external penetration test was performed.'),
    ('3.1.7 Failover and Recovery Testing', 'Verify recovery from a crashed worker, Redis outage, storage errors and email failures without losing or duplicating work.',
     'Crash drill: kill the worker mid-import of 60,000 rows and let a second worker take over. Unit/integration: lease takeover, checkpoint resume, reaper re-queuing lost jobs, uploads accepted while Redis is down, transient-error retries, email outbox retries.',
     'Final listing count equals distinct source rows; no job left pending forever; retries follow the configured backoff; failed emails keep the in-app notification.',
     'scripts/drills/kill-worker-mid-import.sh, Docker, Vitest.',
     'Achieved: drill recovered in 4 min 43 s with no duplicates; all recovery tests pass.',
     'No redundant production deployment is tested; this is restart and recovery, not automatic infrastructure failover. Never run drills against the shared dev stack.'),
    ('3.1.8 Configuration Testing', 'Verify reproducible builds and correct behavior across the documented configurations.',
     'Build all workspaces; run tests on Node 24 in containers; production-URI guard tests; start the dev stack and run the smoke test; CI pipeline on push.',
     'Build exit code 0; health and readiness 200; frontend routes serve the app shell; stored URLs reachable.',
     'npm workspaces, TypeScript, Vite, Docker Compose, GitHub Actions.',
     'Build passed; tests pass on Node 24.21.0; smoke passed except photos on 22 active listings, whose files only existed on an old server (finding F-01).',
     'Stored absolute photo URLs depend on S3_PUBLIC_URL at upload time; see F-01. Browser matrix still to be recorded.')]
for title, objective, technique, oracle, tools, success, considerations in techniques:
    h(title, 3)
    table(['Template field', 'MotorX application'], [['Technique Objective', objective], ['Technique', technique], ['Oracles', oracle],
                                                    ['Required Tools', tools], ['Success Criteria', success], ['Special Considerations', considerations]])

# ---------------------------------------------------------------- 3.2 unit
h('3.2 Unit and Component Testing', 2)
p('Each case below is one test file; its individual tests are listed with their outcomes in test-evidence/automated-test-register.csv. These tests need no running services: databases, queues, storage, Firebase and the network are replaced, and frontend components render in jsdom. They run in seconds and are the first gate in CI.')
unit = [
    ('apps/backend/src/test/db.safety.test.ts', 'Test database target safety', 'Test infrastructure; RR-09', 'Local, Docker, non-test, remote and wrong-scheme URIs; missing TEST_MONGODB_URI.', 'Validate each URI before any connection.', 'Only a motorx_test database on an approved host is accepted; never falls back to MONGODB_URI.'),
    ('apps/backend/src/config/mongoUri.test.ts', 'Production database URI guard', 'PSR-10; RR-09', 'Atlas SRV, TLS/non-TLS, local and test database names.', 'Check each URI with findProductionMongoUriProblems.', 'Production refuses unencrypted, local, test/dev databases and URIs without a database name.'),
    ('apps/backend/src/modules/admin/admin.validation.test.ts', 'Admin request validation', 'FR-ADMIN-02–05', 'Default and bounded pages; user/listing filters; invalid status.', 'Parse query schemas.', 'Defaults and valid filters parse; unsupported values fail.'),
    ('apps/backend/src/modules/dealers/dealer.validation.test.ts', 'Dealer application validation', 'FR-DEALER-02,09–13', 'Multipart fields; incomplete application; missing rejection reason.', 'Parse application and review schemas.', 'Form values normalized; incomplete data and missing rejection reason rejected.'),
    ('apps/backend/src/modules/dealers/dealerDocument.content.test.ts', 'Dealer document content checks', 'FR-DEALER-09; PSR-13–14', 'Plain PDF; PDFs with JavaScript, launch action, embedded file; renamed executable; images with metadata; fake JPEG.', 'Detect type from bytes and sanitize each file.', 'Only safe PDFs and re-encoded images are kept; dangerous or disguised files are rejected.'),
    ('apps/backend/src/modules/inventory/inventory.validation.test.ts', 'CSV upload validation', 'FR-UPLOAD-01–03,07', 'Car and motorcycle headers; missing headers; binary files; paging.', 'Validate files, headers and pagination.', 'Matching headers accepted per category; bad content and missing fields rejected; paging bounded.'),
    ('apps/backend/src/modules/inventory/inventory.service.test.ts', 'Upload acceptance and controlled retry', 'FR-UPLOAD-04–06; RR-06–08', 'Queue available, down, and hanging; dealer at listing limit; job-creation failure; failed and non-failed uploads.', 'Accept uploads and request retries with mocked queue and storage.', 'Uploads are kept for later queuing when Redis is down, the dealer is never kept waiting, storage is cleaned on failure, and only the owner’s failed jobs can be retried.'),
    ('apps/backend/src/modules/marketplace/listing.validation.test.ts', 'Listing validation and identity', 'FR-MARKET-02–05; FR-ETL-19–21', 'Plate variants, pagination, inverted ranges, empty edits, image order, category/powertrain fixtures.', 'Normalize registrations and parse listing schemas.', 'Equivalent plates share one identity; invalid edits, ranges and attributes fail.'),
    ('apps/backend/src/modules/marketplace/listingImage.service.test.ts', 'Image signature check', 'FR-MARKET-13; PSR-14', 'JPEG, PNG, WebP headers; spoofed JPEG; GIF.', 'Check each file signature.', 'Supported signatures accepted; spoofed and unsupported files rejected.'),
    ('apps/backend/src/shared/utils/imageReencode.test.ts', 'Image re-encoding', 'FR-MARKET-13; PSR-13–14', 'JPEG with GPS EXIF and rotation; trailing hidden data; 41-megapixel bomb; fake image; SVG/GIF; PNG document.', 'Re-encode each image.', 'Output is a clean WebP (or PNG for documents), upright, without metadata or hidden data; bombs and disallowed formats refused.'),
    ('apps/backend/src/scripts/listingImageMigration.test.ts', 'Photo migration and small copies', 'PSR-13; Extension (small photo copies)', 'Old root-level photos with GPS; already migrated photos; dry run; CDN URL; photo without small copy; missing and undecodable objects.', 'Run the migration against an in-memory bucket.', 'Photos moved as clean WebP; re-runs skip finished work; dry run changes nothing; an 800 px small copy is created once and its URL recorded; problems reported, not hidden.'),
    ('apps/backend/src/modules/search/search.queryAnalyzer.test.ts', 'Search query analysis', 'FR-SEARCH-08–20; FR-ETL-28', '“automatic SUV under 2 million near Colombo”; “toyata corola”; mileage vs price; oversized query; vector fixture.', 'Analyze queries and normalize embeddings.', 'Correct structured filters and typo corrections; bounded input; normalized 384-length vectors.'),
    ('apps/backend/src/modules/buyers/buyer.similarity.test.ts', 'Vehicle similarity scoring', 'Extension (similar vehicles, recommendations)', 'Same model, same make, other make; price and year differences; case/spacing; view order.', 'Score candidates against one or several viewed vehicles.', 'Closer vehicles score higher; recent views weigh more; ties keep newest-first order.'),
    ('apps/backend/src/shared/utils/pagination.test.ts', 'Pagination metadata', 'FR-SEARCH-06', 'Partial final page; empty collection.', 'Build pagination metadata.', 'Correct page counts; zero pages when empty.'),
    ('apps/backend/src/shared/middleware/verifyFirebaseToken.test.ts', 'Token verification cache', 'FR-USER-07–09; PSR-08', 'Valid, revoked, expiring and missing tokens.', 'Call the middleware repeatedly with a mocked Firebase Admin SDK.', 'Firebase (with revocation) checked once per cache period; never trusted past token expiry; failures not cached.'),
    ('apps/worker/src/pipeline/extract.test.ts', 'CSV extraction', 'FR-ETL-05–06', 'Multi-batch CSV stream; wrong column count.', 'Stream records and record progress.', 'Bounded batches with cumulative progress; malformed rows fail.'),
    ('apps/worker/src/pipeline/normalize.test.ts', 'Vehicle normalization', 'FR-ETL-07,23', 'Whitespace, enum aliases, price suffixes, blank optional cells, motorcycle rows, titles cut short to a prefix of make and model.', 'Normalize rows per category.', 'Consistent values; blanks stay unset; category-specific attributes; a truncated title such as “Toyota Pre” becomes “Toyota Premio”, while a longer title is kept.'),
    ('apps/worker/src/pipeline/transform.test.ts', 'Batch transformation', 'FR-ETL-08–17; RR-05', 'Mixed valid/invalid rows; electric car row.', 'Prepare a batch with known starting row numbers.', 'Valid rows kept; invalid rows isolated with their CSV row numbers.'),
    ('apps/worker/src/pipeline/validate.test.ts', 'Category and powertrain rules', 'FR-MARKET-03; FR-ETL-08–11', 'Petrol, diesel, hybrid, electric, plug-in hybrid cars and five other categories.', 'Validate valid and invalid combinations.', 'Engine or battery data required as appropriate; field-level errors returned.'),
    ('apps/worker/src/services/uploadJob.service.test.ts', 'CSV ETL orchestration', 'FR-ETL-13–22,31–33; RR-06–08', 'Mocked storage/repositories: mixed rows, malformed CSV, duplicates, temporary storage failure, exhausted attempts, crash mid-import, listing limit, lost lease.', 'Run the import service and inspect writes and counters.', 'Accurate counters; permanent vs temporary failures handled differently; resumes from the last checkpoint with no row imported twice; stops when the lease is lost.'),
    ('apps/worker/src/services/imageProcessing.service.test.ts', 'ZIP photo processing', 'FR-MARKET-12–16; RR-06; Extension (small copies)', 'ZIPs with slash/backslash paths, an extra wrapper folder, photos whose extension does not match their content, unknown folders, root files, oversize entries, fake and huge images, storage errors, retries, and a ZIP with no photo in any folder.', 'Process ZIPs with mocked storage and repositories.', 'Photos matched by the folder that contains them (normalized plate), cleaned and resized, an 800 px copy stored and linked; a ZIP with no photos in folders fails at once with instructions; unsafe archives fail at once; retries never attach a photo twice.'),
    ('apps/worker/src/services/jobLease.test.ts', 'Job lease renewal', 'RR-06–08', 'Long-running job; takeover by another worker; renewal error; job end.', 'Hold a lease with fake timers.', 'Lease renewed every third of its duration; loss detected; temporary errors tolerated; renewal stops at the end.'),
    ('apps/worker/src/services/transientError.test.ts', 'Retry classification', 'RR-06–08', 'Network, throttling, 5xx, MongoDB unreachable; missing file, access denied, parse and duplicate errors.', 'Classify each error.', 'Only temporary failures are retried.'),
    ('apps/worker/src/jobs/reaper.job.test.ts', 'Lost-job reconciliation', 'FR-ETL-03; RR-06–08', 'Pending uploads with missing, waiting, delayed or active queue messages; exhausted budgets.', 'Run one reaper cycle with mocked queue.', 'Lost jobs re-queued under the right job ID; jobs with a live message untouched; exhausted jobs failed instead of looping.'),
    ('apps/worker/src/jobs/emailOutbox.job.test.ts', 'Email outbox delivery', 'FR-NOTIFY-06–07; RR-08', 'Due emails; SMTP failures on attempts 1–5; deleted recipient.', 'Run outbox cycles with a mocked mailer.', 'Each email sent once; retries after 1 min, 5 min … 2 h; failed after the fifth attempt; bounded work per cycle.'),
    ('apps/worker/src/jobs/documentRetention.job.test.ts', 'Document retention', 'FR-DEALER-13; PSR-15', 'Decisions older than 90 days; storage delete failure.', 'Run one retention cycle.', 'Files deleted then record cleared; a failed delete is retried next cycle.'),
    ('apps/worker/src/jobs/staleListingReminder.job.test.ts', 'Stale-stock reminders', 'Extension (stale stock)', 'Dealers with stale listings; claim won or lost; one dealer failing.', 'Run one reminder cycle with mocked repositories.', '60-day cutoff and 7-day repeat applied; each dealer gets their own count once; one failure does not stop the others.'),
    ('apps/frontend/src/features/auth/components/RoleGuard.test.tsx', 'Role-protected pages', 'FR-USER-10–12', 'Signed-out, allowed, disallowed and pending-applicant users.', 'Render protected routes.', 'Redirect to login, show page, show “Access Restricted” or send to the application status page as appropriate.'),
    ('apps/frontend/src/features/auth/components/EmailVerificationBanner.test.tsx', 'Email verification banner', 'FR-USER-04', 'Verified, unverified and signed-out users.', 'Render the banner and resend/refresh.', 'Shown only when needed; resend works; hides once verified.'),
    ('apps/frontend/src/features/auth/context/AuthProvider.test.tsx', 'Per-account data isolation', 'FR-USER-12; PSR-09', 'Sign-out; a different account signing in on the same browser.', 'Switch accounts and inspect the query cache.', 'Previous account’s cached data is cleared before the next user can see it.'),
    ('apps/frontend/src/features/auth/pages/RegisterPage.test.tsx', 'Dealer application from an existing account', 'FR-DEALER-09–13', 'Rejected and pending applications for a signed-in buyer.', 'Render the application page and resubmit.', 'Rejection reason shown, answers pre-filled, no password asked, resubmission sent with new documents; pending applicants redirected.'),
    ('apps/frontend/src/portals/dealer/pages/DealerProfile.test.tsx', 'Dealer profile editing', 'FR-DEALER-01–04', 'Approved dealer profile; server error.', 'Edit and save.', 'Verified name and registration read-only; edits saved and confirmed; server errors shown.'),
    ('apps/frontend/src/portals/dealer/pages/UploadDetails.test.tsx', 'Upload details and publish-all', 'FR-UPLOAD-06–08; Extension (bulk)', 'Failed CSV, failed photos, refused retry, successful upload with 9 drafts.', 'Render the page and use Retry and Publish all.', 'Failure reasons and retries work; all drafts of the upload are published in one request after confirmation.'),
    ('apps/frontend/src/portals/dealer/pages/ListingManager.test.tsx', 'Bulk and stale-stock tools', 'FR-DEALER-05–08; Extension (bulk, stale)', 'Stats with 2 stale listings; draft and stale listings.', 'Use the banner, select-all bulk publish, one-click “Still available” and the price dialog.', 'Stale banner opens the stale list; one request publishes all selected; age shown; price cut previewed (5,400,000 at 10%) then applied; skipped listings explained.'),
    ('apps/frontend/src/portals/admin/pages/adminPages.test.tsx', 'Admin approvals, dashboard and monitoring', 'FR-ADMIN-03–08', 'Deep links with status/applicationId/uploadId; failing sections; date ranges.', 'Render admin pages from links.', 'Correct tab and exact application highlighted; failures shown as unavailable, not zero; filters passed to the server.'),
    ('apps/frontend/src/portals/buyer/pages/VehicleDetails.test.tsx', 'Vehicle page on phones', 'FR-MARKET-07–11; Extension (mobile, discovery)', 'Listing with three photos (small copies) and a dealer phone 077 123 4567.', 'Render, swipe, tap arrows, scroll vertically.', 'Call/WhatsApp/Email bar with the WhatsApp message ready (94771234567); small copy chosen via srcset; swipe changes photo, vertical scroll does not; vehicle remembered for recommendations; similar vehicles shown.'),
    ('apps/frontend/src/features/compare/compare.test.tsx', 'Compare vehicles', 'Extension (compare)', 'Four vehicles; two vehicles with different price/year/mileage; one unavailable.', 'Add to compare, open comparison.', 'At most three; full list explained; best price, year and mileage highlighted; unavailable vehicle stated.'),
    ('apps/frontend/src/shared/components/mobileLayout.test.tsx', 'Mobile navigation and card tables', 'UR-01–04; Extension (mobile)', 'Portal with two pages; table with two columns.', 'Open menu, press Escape, choose a page; render a table.', 'Drawer opens with focus inside; closes on Escape (focus returns) and after navigation; every cell labelled with its column.'),
    ('apps/frontend/src/shared/i18n/i18n.test.tsx', 'Sinhala and Tamil', 'Extension (languages)', 'All dictionaries; Tamil browser preference.', 'Compare dictionaries; switch language; reload.', 'Every message translated with identical placeholders; whole site switches, page lang set, choice remembered; Tamil chosen automatically for a Tamil browser.'),
    ('apps/frontend/src/shared/utils/phone.test.ts', 'WhatsApp number formatting', 'Extension (mobile contact)', 'Local, +94, 9-digit, foreign and invalid numbers.', 'Convert numbers and build links.', 'Sri Lankan numbers get 94; foreign numbers kept; undialable numbers give no link.'),
    ('apps/backend/src/modules/inventory/inventory.queue.test.ts', 'Queue publishing for repeat photo uploads', 'FR-UPLOAD-08; RR-06–08', 'Existing queue jobs that are completed, failed, waiting, active or delayed.', 'Publish CSV and photo jobs with a mocked queue.', 'A finished job is removed and queued again under the same ID, so photos attached a second time are processed; a job still waiting or running is never duplicated (finding F-09).')]
unit_total = 0
for k, (rel, title, refs, pre, steps, expected) in enumerate(unit, 1):
    unit_total += automated_case(f'UT-{k:02}', rel, title, refs, pre, steps, expected)
assert unit_total == 234, unit_total
p(f'Unit and component result: {unit_total} tests in {len(unit)} files, all passed.')

# ---------------------------------------------------------------- 3.3 integration
h('3.3 Integration Testing', 2)
p('Integration tests cross a real boundary. Data integration tests run repository and service code against a real MongoDB 7 replica set (needed for transactions and unique indexes) and, for rate limits, a real Redis. HTTP journey tests start the real Express application and send requests through every middleware to the real database; only the Firebase Admin SDK and the S3 client are replaced. All ran in the isolated Docker project motorx-test with --maxWorkers=1. Cases IT-12 to IT-15 cross external services (real Firebase, SMTP, a queue with a live worker, a search dataset) and remain planned.')
integration_auto_list = [
    ('apps/backend/src/modules/dealers/dealer.repository.test.ts', 'Dealer application persistence', 'FR-DEALER-09', 'Empty test database; valid application.', '1. Create an application. 2. Find it by user ID.', 'One pending application with the stored fields.'),
    ('apps/backend/src/modules/admin/admin.repository.test.ts', 'Pending applications oldest first', 'FR-ADMIN-03', 'Two applications submitted in order.', '1. Create A then B. 2. List pending.', 'Both returned, oldest submission first.'),
    ('apps/backend/src/modules/marketplace/listing.repository.test.ts', 'Registration uniqueness in MongoDB', 'FR-ETL-19–22; RR-08', 'Active, archived and differently formatted plates.', '1. Look up duplicates. 2. Insert a second draft/active listing with the same plate. 3. Relist after archiving.', 'Duplicates found across formats; the database itself rejects a second open listing; archived plates can be relisted.'),
    ('apps/backend/src/modules/marketplace/listing.service.test.ts', 'Listing update persistence', 'FR-MARKET-05', 'Owned listing with a description.', '1. Set description to null. 2. Set a new description.', 'Description removed, then updated, in the stored document.'),
    ('apps/backend/src/modules/admin/admin.documentAccess.test.ts', 'Audited document access', 'FR-ADMIN-06; PSR-15', 'Dealer with documents; deleted documents; invalid index.', '1. Admin opens a document. 2. Open after retention deletion. 3. Open a missing index.', 'Each view audited with who and which file; 410 Gone after deletion without an audit entry; no entry for a missing file.'),
    ('apps/backend/src/shared/middleware/rateLimits.test.ts', 'Rate limits with real Redis', 'PSR-13; RR-10', 'Limiter with small budget; Redis unavailable; real Redis store.', '1. Exceed the budget. 2. Stop the store. 3. Count only successes. 4. Share one budget via Redis. 5. Exceed upload concurrency.', '429 in the standard format; requests allowed when Redis is down; one shared budget across instances; 503 with Retry-After beyond the upload limit.'),
    ('apps/backend/src/scripts/listingImageMigration.db.test.ts', 'Photo URL updates in MongoDB', 'PSR-13; Extension (small photo copies)', 'Listing whose photo keys contain dots, as real keys do.', '1. Set the small-copy URL on one photo. 2. Rewrite both photo URLs.', 'Only the listed photos change and all other image fields are kept (regression test for finding F-08).'),
    ('apps/worker/src/repositories/jobSafety.db.test.ts', 'Lease ownership and idempotent writes', 'RR-06–08; FR-ETL-31–32', 'Upload job with an expired and a valid lease; repeated batches.', '1. Take over an expired lease and write as the old owner. 2. Try to claim a job with a valid lease. 3. Insert the same CSV row twice. 4. Record the same rejection twice.', 'Only the current owner can write; a valid lease cannot be stolen; one listing per CSV row and one rejection per bad row.')]
integration_journeys = [
    ('apps/backend/src/test/accessControl.journey.test.ts', 'Access control across dealers and roles', 'FR-USER-07–12; PSR-08–09; FR-DEALER-10', 'Buyer, dealers A and B, admin and a suspended user; listings, uploads, documents and notifications owned by A.', '1. As B, request, edit, delete and retry A’s resources by ID. 2. Read drafts and private storage publicly. 3. Call dealer/admin routes without a token and with wrong roles. 4. Use a suspended account’s valid token. 5. Approve an applicant with an unverified email.', 'Every foreign access is refused with no change to A’s data; drafts and private objects never public; 401/403 as appropriate; suspended accounts blocked; approval refused until the email is verified.'),
    ('apps/backend/src/test/dealerLifecycle.journey.test.ts', 'Dealer lifecycle and admin monitoring', 'FR-DEALER-01–13; FR-ADMIN-03–07', 'Buyer applying from an existing account; admin; listings of a dealer who is later suspended.', '1. Suspend a dealer and check browse, details and search; reactivate. 2. Edit the dealer profile. 3. Apply as a signed-in buyer; reject; correct and resubmit. 4. Try to apply again once approved. 5. Filter uploads and audit logs by ID and date.', 'Suspended dealers’ listings vanish from all public views and return on reactivation; only allowed profile fields change; resubmission keeps history and replaces documents; filters return exactly the matching records.'),
    ('apps/backend/src/test/listingTools.journey.test.ts', 'Bulk tools, stale stock and discovery', 'FR-DEALER-05–08; Extension (bulk, stale, discovery, small copies)', 'Two dealers; drafts, active, sold and archived listings; listings of one CSV upload; stale dates; a suspended dealer; photos with small copies.', '1. Bulk publish chosen drafts and all drafts of one upload. 2. Send a rival’s IDs. 3. Mark sold, archive, cut prices 10%, delete archived. 4. Send invalid bulk requests and a buyer’s request. 5. Check stale counts, ordering and fresh-again actions. 6. Request similar and recommended vehicles. 7. Fetch a small photo copy.', 'Only eligible own listings change and the rest are counted as skipped; prices 6,000,000 → 5,400,000; photos and small copies deleted from storage; invalid requests 400, buyers 403; stale = active and unconfirmed for 60 days (legacy listings by update time); similar and recommended lists are ranked, exclude the seed/viewed and hidden listings; small copy served from thumbs/.')]
it_total = 0
migration_db = integration_auto_list.pop(6)  # listed with the data tests, numbered after the journeys
for k, args in enumerate(integration_auto_list + integration_journeys + [migration_db], 1):
    it_total += automated_case(f'IT-{k:02}', *args)
assert it_total == 56, it_total
planned_it = [
    ('IT-12', 'Real Firebase identity', 'FR-USER-01–09; PSR-08', 'Dedicated test Firebase project or emulator [7]; buyer and dealer test accounts.', '1. Sign in and call /api/v1/auth/me twice. 2. Revoke the refresh token; call again after the cache period. 3. Delete the Firebase user.', 'One local profile per Firebase user; revoked or deleted users lose access within the cache period (2 minutes).'),
    ('IT-13', 'Real SMTP delivery and failure', 'FR-NOTIFY-06–07', 'Test mailbox or local mail sink; failed import and approval events.', '1. Trigger the events. 2. Check received mail. 3. Break SMTP credentials and trigger again.', 'Mail arrives with the right content; with SMTP broken, in-app notifications remain and email status becomes pending then failed after five attempts.'),
    ('IT-14', 'CSV and ZIP through queue and live worker', 'FR-UPLOAD-04–08; FR-ETL-01–33', 'Running backend + worker + Redis + MinIO; CSV with valid, invalid and duplicate rows; ZIP with matching and unknown folders.', '1. Upload the CSV through the API. 2. Wait for completion. 3. Upload the ZIP. 4. Inspect listings, rejected rows, photos and small copies.', 'Counts match the fixture; rejected rows keep their row numbers; photos and small copies attached only to this upload’s listings; unknown folder reported.'),
    ('IT-15', 'Search relevance on a labelled dataset', 'FR-SEARCH-01–20', 'Over 300 listings including older exact matches; 20 pre-labelled queries.', '1. Run each query with semantic search on and off. 2. Record the top five.', 'Hard filters always hold; the labelled match is in the top five for at least 18 of 20 queries (proposed target).')]
for id, title, refs, pre, steps, expected in planned_it:
    case(id, title, refs, pre, steps, expected, 'Planned; not executed', 'Not yet recorded')
p(f'Integration result: {it_total} automated tests in 11 files, all passed (24 data-integration, 32 HTTP journey). IT-12 to IT-15 planned.')

# ---------------------------------------------------------------- 3.4 e2e
h('3.4 End-to-End Testing', 2)
p('End-to-end tests exercise the whole running system. Two system-level procedures were executed on running containers. The browser journeys below are written as step-by-step scripts for a tester using the real frontend with separate browser profiles for the buyer, dealer and administrator; record the actual result, tester, date and screenshots in the case register. Use a dedicated test Firebase project and synthetic data. At the time of writing these journeys have not been executed, so they are reported as “Not executed”.')
case('E2E-A1', 'Worker crash during a 60,000-row import (system)', 'RR-06–08; FR-ETL-31–32; PSR-05',
     'Isolated Docker test stack (MongoDB replica set, Redis, MinIO, two worker containers); generated CSV of 60,000 unique rows.',
     '1. Start the import. 2. Kill the first worker part-way through. 3. Let the second worker take over after the 2-minute lease expires. 4. Count listings and distinct source rows.',
     'Import completes without manual action; listings = 60,000 = distinct source rows; no duplicates.',
     'Executed (Sep 2026): passed — completed by the second worker in 4 min 43 s with 60,000 listings from 60,000 distinct rows.',
     'scripts/drills/kill-worker-mid-import.sh; result recorded in docs/RESILIENCE.md', actual='Passed; 60,000/60,000 rows, no duplicates', tester='Automated drill script', executed='Sep 2026 (see RESILIENCE.md)')
case('E2E-A2', 'Live-stack smoke test with real data (system, read-only)', 'FR-MARKET-07–11; FR-SEARCH-01–06; FR-USER-10–12; PSR-01–02',
     'Running development stack (backend and frontend rebuilt from the baseline, real Atlas data, MinIO); GET requests only; the script checks the main photo of every active listing.',
     '1. Run python scripts/smoke/live-stack-smoke.py. 2. Save the output to test-evidence/live-smoke-output.txt.',
     'Health/readiness 200; browse shows only active listings; price filter holds; search answers; invalid IDs 400; dealer/admin routes 401 without sign-in; details include dealer; similar/recommended exclude seed/viewed; every active listing\'s main photo and small copy load; frontend routes serve the app.',
     f"Executed {smoke['recordedAt'][:10]} (after the photo migration): {smoke['passed']} passed, {smoke['failed']} failed, {smoke['skipped']} skipped. Failed: only 1 of 23 active listings' main photos loads; 22 point to the old server 13.207.143.45 and their files are not in this storage (finding F-01). The one migrated photo and its small copy load.",
     'scripts/smoke/live-stack-smoke.py; test-evidence/live-smoke-output.txt and live-smoke-results.json',
     actual=f"{smoke['passed']} passed; {smoke['failed']} failed (F-01: 22 of 23 photos); {smoke['skipped']} skipped", tester='Smoke script (run by team member)', executed=smoke['recordedAt'])
e2e = [
    ('E2E-01', 'Buyer registration, sign-in and session', 'FR-USER-01–06A', 'Unused test email; existing buyer account.', '1. Open /signup; submit with missing fields and mismatched passwords. 2. Register a valid buyer; open the verification email. 3. Sign out and sign in. 4. Try a wrong password and a duplicate email. 5. Reload /marketplace while signed in.', 'Clear field errors; one account created; verification banner disappears after verifying; wrong password shows “The email address or password is incorrect.”; session survives reload.'),
    ('E2E-02', 'Dealer application and approval', 'FR-DEALER-09–13; FR-ADMIN-03,06', 'Applicant with a PDF registration and ID; admin in a second browser profile.', '1. Apply at /dealer/apply. 2. Check the status page and that /dealer is refused. 3. Admin opens Dealer Approvals from the dashboard link, views both documents and approves. 4. Applicant signs in again.', 'Application appears in Pending (oldest first); document views appear in Audit Logs; applicant reaches the Dealer Dashboard; an approval notification appears.'),
    ('E2E-03', 'Rejection, correction and resubmission', 'FR-DEALER-11–13', 'Pending applicant; admin.', '1. Admin rejects with a reason. 2. Applicant opens the status page and chooses “Correct and resubmit”. 3. Changes a field, attaches new documents and resubmits. 4. Admin reviews again.', 'Reason shown to the applicant; form pre-filled without a password field; resubmission returns to Pending with the earlier rejection shown in its history.'),
    ('E2E-04', 'Create, edit, publish and photograph a vehicle', 'FR-MARKET-01–05,07–16', 'Approved dealer; unique car; two photos; buyer profile.', '1. Add New Vehicle with two photos as a draft. 2. Edit the price. 3. Publish from My Listings. 4. As buyer, open it from the marketplace. 5. Dealer removes one photo; buyer reloads.', 'Draft not visible to the buyer; after publishing, details, price and dealer contacts are correct; removed photo no longer shown; photos load the small copy on a phone-width window (check the Network tab).'),
    ('E2E-05', 'Recover from a failed photo upload', 'FR-MARKET-12–15; RR-08–09', 'New vehicle; block the image request once (DevTools request blocking).', '1. Create the vehicle with two photos while one request is blocked. 2. Read the error. 3. Unblock and use “Retry images”. 4. Press Create again once, deliberately.', 'Exactly one listing exists; the missing photo can be added from the edit page; pressing Create again is refused as a duplicate registration, not a second listing.'),
    ('E2E-06', 'CSV import, corrections and ZIP photos', 'FR-UPLOAD-01–08; FR-ETL-13–22,31–33', 'Category template; CSV with valid, invalid and duplicate rows; ZIP with a matching and an unknown folder.', '1. Download the car template. 2. Upload the mixed CSV and watch the status. 3. Read rejected rows. 4. Upload the ZIP. 5. Use “Publish all N” on the upload page. 6. Check the marketplace.', 'Counters match the file; each rejection names the row and reason; unknown folder listed; after Publish all, every valid vehicle is public with its photos; notifications match the result.'),
    ('E2E-07', 'Buyer search, filters and dealer contact on a phone', 'FR-MARKET-07–11,16; FR-SEARCH-01–20; Extension (mobile)', 'Seeded catalogue; DevTools device mode at 390 × 844.', '1. Search “automatic SUV under 8 million near Colombo”. 2. Open “Filters (n)”, add a make, press “Show N vehicles”. 3. Try “toyata corola” and a no-match query. 4. Open a vehicle; swipe the photos; tap WhatsApp.', 'Results respect the filters; the sheet shows the active filter count; empty results explain what to do; swipe changes photos; WhatsApp opens with the number in 94… form and the message pre-filled.'),
    ('E2E-08', 'Similar vehicles, recommendations and compare', 'Extension (discovery, compare)', 'Catalogue with several makes; fresh browser profile.', '1. Open three vehicles. 2. Return to the marketplace and check “Recommended for you”. 3. On a vehicle page, check “Similar vehicles”. 4. Add three vehicles to compare; try a fourth. 5. Open “Compare now”, remove one, reload, copy the link to another profile.', 'Recommendations appear only after viewing and never include the viewed vehicles; similar vehicles exclude the current one; fourth vehicle refused with a message; best price/year/mileage highlighted; the shared link shows the same comparison.'),
    ('E2E-09', 'Bulk actions and stale stock', 'FR-DEALER-05–08; Extension (bulk, stale)', 'Dealer with drafts and at least one active listing whose lastConfirmedAt is older than 60 days (set in the test database).', '1. Open the dashboard and read the stale banner. 2. Review now → Needs attention. 3. Use Still available, Reduce price 10% and Mark sold on different rows. 4. On My Listings, select all drafts and Publish. 5. Archive two and Delete permanently.', 'Counts in the banner and tab match; each action updates the list and the counts; reduced price shown to buyers; skipped listings explained; deleted listings and photos gone.'),
    ('E2E-10', 'Stale-stock reminder notification', 'Extension (stale stock); FR-NOTIFY-01–03', 'Worker running the baseline; dealer with stale listings.', '1. Start the worker. 2. Open the dealer’s notification bell. 3. Click the reminder. 4. Restart the worker.', 'One reminder with the correct count; clicking opens the Needs attention list; no second reminder within 7 days after restart.'),
    ('E2E-11', 'Administrator moderation and suspension', 'FR-ADMIN-01–06,09–10; FR-USER-10–11', 'Admin and an active dealer with public listings.', '1. Suspend the dealer. 2. As buyer, search for their vehicle. 3. As the dealer, try to edit a listing. 4. Reactivate. 5. Check Audit Logs filtered by today.', 'Suspended dealer’s vehicles disappear from browse, search and details; dealer actions refused; everything returns after reactivation; both actions audited with the admin’s name.'),
    ('E2E-12', 'Responsive layout and keyboard use', 'UR-01–04,09–12,16–18; Extension (mobile)', 'Widths 360, 390, 768 and 1440 px; keyboard only.', '1. On each width, use the menu in the buyer site and in the dealer and admin portals. 2. Open and close the filter sheet, compare tray and price dialog with Tab/Enter/Escape. 3. View My Listings and Upload Monitoring on a phone width. 4. Tap an input on an iPhone-size width.', 'No page scrolls sideways; menus reachable at every width and close on Escape; focus visible and returned; tables show as labelled cards; inputs do not zoom the page; buttons at least 44 px tall.'),
    ('E2E-13', 'Sinhala and Tamil', 'Extension (languages)', 'Native Sinhala and Tamil readers if available.', '1. Choose සිංහල in the navbar, browse, search and open a vehicle. 2. Reload. 3. Choose தமிழ் and repeat. 4. Sign in page in each language.', 'All buyer pages and sign-in change language; choice survives reload; text fits on a phone; readers confirm wording is natural (record their comments).'),
    ('E2E-14', 'Notification centre and email status', 'FR-NOTIFY-01–07', 'Dealer and admin; test mailbox.', '1. Trigger a failed import and an approval. 2. Check bell counts. 3. Open and mark read; reload. 4. Check another user’s inbox.', 'Right recipient, correct unread count after reload, email status shown; other users see nothing of it.'),
    ('E2E-15', 'Mobile performance audit', 'PSR-01; Extension (mobile)', 'Production build served locally; Lighthouse in Chrome, mobile preset.', '1. Audit the landing page, marketplace and one vehicle page. 2. Save the reports.', 'Record Performance, Accessibility and Best Practices scores and LCP; compare with the pre-mobile baseline if available.')]
for id, title, refs, pre, steps, expected in e2e:
    case(id, title, refs, pre, steps, expected, 'Not executed (manual browser journey)', 'Record screenshots and notes in the case register', priority='High' if id not in ('E2E-13', 'E2E-15') else 'Medium')

# ---------------------------------------------------------------- 3.5 nf
h('3.5 Non-functional Test Cases', 2)
bench = 'apps/worker/src/benchmarks/importThroughput.bench.test.ts'
n, passed, when, _ = executed(bench)
case('NF-01', '5,000-record import throughput', 'PSR-04–06', '5,000 unique valid car rows; real CSV pipeline, MongoDB replica set and MinIO; local Docker on the test laptop.',
     'Run with RUN_BENCHMARKS=1 (command in 3.6); repeat twice.', 'All 5,000 rows imported within 120 s.',
     f'Executed {DATE_SHORT}: passed twice — 11.1 s and 11.2 s (≈450 records/s).', f'{bench}; test-evidence/benchmark-output.txt',
     priority='High', actual='11.1 s and 11.2 s; 5,000/5,000 rows', tester='Automated Vitest runner', executed=when)
automated_rows.append({'ID': 'NF-01.01', 'Group': 'NF-01', 'Level': 'NF', 'File': bench, 'Test': suites[bench][1]['assertionResults'][0]['fullName'], 'Status': 'passed', 'DurationMs': round(suites[bench][1]['assertionResults'][0].get('duration') or 0, 1), 'Evidence': 'worker-results.json'})
case('NF-02', 'API and search response time', 'PSR-01–03', 'Known catalogue; agreed normal load; fixed provider settings.',
     '1. Warm up 2 minutes. 2. Run browse, filter, search and details requests for 10 minutes with k6. 3. Repeat three times.',
     'Normal API p95 ≤ 2 s; structured search ≤ 2 s; semantic search normally ≤ 5 s.',
     'Partly evidenced: single smoke requests took 3–868 ms (A2); percentile run not executed.', 'test-evidence/live-smoke-results.json (indicative only)', priority='Medium')
case('NF-03', 'Concurrent load and stability', 'PSR-01,06–07', 'Isolated stack; workload from 3.1.5.', '1. Run 5, 20 and 50 virtual users. 2. Record latency, errors, CPU, memory and queue depth. 3. Observe recovery.',
     'Normal-load stage meets PSR targets; under 1% server errors; no data loss; memory and queue return to normal.', 'Not executed', 'Not yet recorded', priority='Medium')
case('NF-04', 'Upload limits and unsafe files', 'FR-MARKET-13; PSR-13–14', 'Image pixel bomb, fake images, dangerous PDFs, ZIP expansion and entry limits, upload concurrency.',
     'Covered by UT-05, UT-09, UT-10, UT-21 and IT-06.', 'Unsafe content refused before it can use large memory; limits return clear errors.',
     'Executed through the listed automated cases: passed.', 'See UT-05, UT-09, UT-10, UT-21, IT-06', priority='Medium', actual='Passed (see referenced cases)', tester='Automated Vitest runner', executed=DATE_SHORT)
case('NF-05', 'Build, configuration and supply-chain checks', 'SRS 2.4; PSR-10,12', 'Locked dependencies; Node 24; CI workflow.',
     '1. Build all workspaces. 2. Run Gitleaks, Trivy and npm audit (CI). 3. Record browser versions during E2E.',
     'Builds succeed; no leaked secrets; no high/critical image vulnerabilities; browsers recorded.',
     'Executed (build) 26 Sep 2026: passed, exit 0. Security scans ran clean during the hardening work and run in CI on each push; browser matrix pending.', 'test-evidence/build-output.txt; .github/workflows/ci.yml', priority='Medium',
     actual='Build passed', tester='Team member (npm)', executed=DATE_SHORT)
case('NF-06', 'Search relevance and fallback quality', 'FR-SEARCH-08–20', 'Same dataset as IT-15.', 'See IT-15; also record precision@5 with the embedding provider unavailable.',
     'Hard filters hold; target 18/20 labelled matches in the top five.', 'Not executed', 'Not yet recorded', priority='Medium')

# ---------------------------------------------------------------- 3.6 env
h('3.6 Environment, Data and Execution', 2)
table(['Environment', 'Configuration / purpose'], [
    ['Automated runs (this report)', f"Host {meta['hostPlatform']}; Docker Desktop; Node {meta['nodeInContainers']} in containers; Vitest 4 (backend, worker) and 5 (frontend); baseline {meta['revision'][:7]}."],
    ['Unit / component', 'No services needed. Frontend tests run in jsdom with two workers (memory limit on the test laptop).'],
    ['Integration and performance', 'Isolated compose project motorx-test: MongoDB 7 replica set rs0 (database motorx_test), Redis 7, MinIO test bucket. Nothing is shared with the development stack.'],
    ['Live smoke', 'Development stack (compose project motorx) with backend and frontend rebuilt from the baseline, real MongoDB Atlas data and local MinIO; read-only requests.'],
    ['Browser end-to-end', 'Frontend, backend and worker from the baseline; dedicated test Firebase project; test mailbox; browsers recorded per run; widths 360, 390, 768 and 1440 px.'],
    ['Continuous integration', 'GitHub Actions: build, backend/worker/frontend tests, Gitleaks, Trivy; weekly scheduled run.']])
table(['Fixture', 'Contents'], [
    ['Accounts', 'Created per test with synthetic names (buyer, dealers A/B, admin, suspended user); Firebase identities replaced in integration tests.'],
    ['Listings', 'Built in each test with deterministic registration numbers (e.g. CAX-1001); all six categories and fuel types covered by unit fixtures.'],
    ['CSV and ZIP', 'Generated in tests: mixed valid/invalid/duplicate rows, malformed rows, backslash paths, unknown folders, oversize entries; 5,000 and 60,000-row generated files for performance and the drill.'],
    ['Images and documents', 'Generated with sharp (GPS EXIF, rotation, 41 MP bomb) and hand-built PDFs (JavaScript, launch action, embedded file).'],
    ['Browser journeys', 'Synthetic dealer and buyer accounts in the test Firebase project; never real customer documents.']])
p('Commands used for this report (repository root):')
code('docker compose -f compose.yml -f compose.test.yml run --rm backend      # 147 backend tests\n'
     'docker compose -f compose.yml -f compose.test.yml run --rm -e RUN_BENCHMARKS=1 worker   # 94 worker tests incl. benchmark\n'
     'cd apps/frontend; npx vitest run                                          # 50 frontend tests\n'
     'npm run build --workspaces --if-present\n'
     'bash scripts/drills/kill-worker-mid-import.sh                             # crash drill (test stack)\n'
     'python scripts/smoke/live-stack-smoke.py                                 # read-only smoke of a running stack')
p('JSON evidence was produced by adding --reporter=json --outputFile=… to the test commands. Never point the test commands or the drill at the development stack or Atlas: the database guard (UT-01) refuses any database other than motorx_test on a local host.')

# ---------------------------------------------------------------- 3.7 criteria
h('3.7 Entry, Exit and Suspension Criteria', 2)
table(['Gate', 'Criteria'], [
    ['Entry', 'Baseline commit recorded; dependencies installed; build passes; isolated test stack healthy with a replica-set primary; fixtures and test accounts available.'],
    ['Per-case pass', 'Every expected outcome observed and evidence linked. A partial run, an unavailable dependency or a missing feature is never a pass.'],
    ['Exit (submission)', 'All automated suites pass (met: 291/291); all Critical and High browser journeys executed and passed; no open Critical/High findings or each one accepted by the team with a workaround; performance evidence for PSR-05 (met) and PSR-01–03 recorded or listed as unmet.'],
    ['Suspend', 'Wrong database or storage target, unreliable fixtures, unavailable critical dependency, suspected data corruption.'],
    ['Resume', 'Cause fixed; isolation rechecked; smoke test passes; affected cases rerun.']])
p('Severity: Critical = unauthorized access or data loss; High = essential journey blocked or wrong inventory state; Medium = degraded with a workaround; Low = presentation only. Each finding records baseline, case ID, steps, expected and actual results, evidence and severity, and is retested with its neighbouring cases after the fix.')

# ---------------------------------------------------------------- 3.8 roles
h('3.8 Responsibilities and Schedule', 2)
table(['Owner role', 'Responsibility'], [
    ['M1 — Auth/Dealers/Marketplace', 'E2E-01 to E2E-05, E2E-11; access-control findings.'],
    ['M2 — Inventory/ETL', 'E2E-06, E2E-09, E2E-10; IT-14; crash drill reruns; NF-01.'],
    ['M3 — Search/Notifications/Admin', 'E2E-07, E2E-08, E2E-14; IT-12, IT-13, IT-15; NF-02, NF-03, NF-06.'],
    ['All members', 'E2E-12, E2E-13 and E2E-15 on their own phones and browsers; native-language review.'],
    ['Cross-reviewer / supervisor', 'Review results and findings; record the submission decision.']])
table(['When', 'Activity', 'Exit artifact'], [
    ['Done (26 Sep)', 'Automated unit, integration, benchmark and smoke runs.', 'JSON evidence, registers, this report'],
    ['T−3 days', 'Browser journeys E2E-01 to E2E-14 in the test Firebase project.', 'Case register with results and screenshots'],
    ['T−2 days', 'Restore or re-upload photos for the 22 listings (F-01); Lighthouse audit (E2E-15); k6 load run if time allows.', 'Retest evidence; Lighthouse reports'],
    ['T−1 day', 'Full automated regression; demo rehearsal; update Section 4.1.', 'Final evaluation summary']], widths=[1.2, 3.8, 1.85])

# ---------------------------------------------------------------- 4
h('4. Deliverables')
table(['Deliverable', 'Location'], [
    ['Master test plan and evaluation report', 'docs/MotorX_Test_Plan_Report.docx (Word, from the supplied template) and docs/MotorX_Test_Plan_Report.md'],
    ['Case register', f'docs/MotorX_Test_Case_Register.csv — {len([c for c in cases])} cases with level, requirements, steps, expected/actual results, tester, date and defect fields'],
    ['Executed test register', f'docs/test-evidence/automated-test-register.csv — every automated test ({TOTAL}) with file, status and duration'],
    ['Raw test results', 'docs/test-evidence/backend-results.json, worker-results.json, frontend-results.json'],
    ['Performance and smoke evidence', 'docs/test-evidence/benchmark-output.txt; live-smoke-output.txt; live-smoke-results.json'],
    ['Build and environment', 'docs/test-evidence/build-output.txt; run-metadata.json'],
    ['Drill and smoke scripts', 'scripts/drills/kill-worker-mid-import.sh; scripts/smoke/live-stack-smoke.py'],
    ['Still to produce', 'Browser journey results and screenshots, Lighthouse reports, load-test results, team sign-off']])

h('4.1 Test Evaluation Summaries', 2)
by_level = {}
for c in cases:
    lvl = c['Level'] if c['Level'] in ('UT', 'IT', 'NF') else 'E2E'
    done = c['Status'].startswith('Executed')
    by_level.setdefault(lvl, [0, 0])
    by_level[lvl][0] += 1
    by_level[lvl][1] += done
table(['Evaluation item', 'Observed result', 'Interpretation'], [
    ['Unit / component', f'{len(unit)} files; 234 passed; 0 failed.', 'Business rules, schemas, security helpers, worker services and React components behave as specified.'],
    ['Integration — data', '8 files; 24 passed; 0 failed.', 'Real MongoDB constraints, leases, audit, photo URL updates and Redis limits hold.'],
    ['Integration — HTTP journeys', '3 files; 32 passed; 0 failed.', 'Complete API use cases work through all middleware with correct authorization and stored results.'],
    ['Performance (PSR-05)', '5,000 rows in 11.1–11.2 s.', 'Meets the 120 s target by a wide margin on the test laptop.'],
    ['Crash recovery (system)', '60,000 rows; recovered in 4 min 43 s; no duplicates.', 'Lease takeover and checkpoints work with real containers.'],
    ['Live smoke (system)', f"{smoke['passed']} passed; {smoke['failed']} failed; {smoke['skipped']} skipped.", 'Running application with real data works end to end; the failure is F-01.'],
    ['Total automated', f'{TOTAL} executed; {TOTAL} passed; 0 failed.', '100% pass rate for executed automated tests.'],
    ['Case register', f"UT {by_level['UT'][1]}/{by_level['UT'][0]} executed; IT {by_level['IT'][1]}/{by_level['IT'][0]}; E2E {by_level['E2E'][1]}/{by_level['E2E'][0]}; NF {by_level['NF'][1]}/{by_level['NF'][0]}.", 'Not-executed cases are listed separately and never counted as passed.'],
    ['Browser end-to-end', '0 of 15 executed.', 'Required before the exit criteria are met.']])
p('Assessment: the automated evidence is strong and fully green, and the running system passed a real-data smoke test apart from one configuration defect. The build is not yet fully accepted because the browser journeys (Section 3.4) have not been executed and F-01 is open. Both can be completed in the time planned in Section 3.8.')
table(['ID', 'Finding', 'Severity / status', 'Action'], [
    ['F-01', 'Photos on 22 of the 31 active listings (78 photos) point to http://13.207.143.45:3000, an old server that no longer responds, and their files are not in the current storage, so they cannot load (found by E2E-A2). The 91 photos whose files were present were migrated on 26 Sep with small copies created, and load.', 'High (demo) / Partly fixed', 'Copy the 78 original files from the old server or bucket into storage and rerun the migration with --public-url, or re-upload photos for the 22 listings; then rerun E2E-A2.'],
    ['F-02', 'The 5,000-row benchmark cleared its collections before the models were loaded, so a second run in the same test database rejected every row as a duplicate.', 'Medium (test defect) / Fixed', 'Clean-up moved after model loading; passed twice in a row.'],
    ['F-03', 'Photos uploaded before small copies existed had no 800 px copy, so phones downloaded the full photo.', 'Low / Fixed for all 91 stored photos', 'Migration run on 26 Sep created 90 copies (1 in an earlier attempt); a second run found nothing left to do. Remaining photos follow F-01.'],
    ['F-04', 'SRS FR-NOTIFY-06 asks for completion emails; the implementation emails only failed or partly failed imports (clean completion is in-app only).', 'Medium / Decision needed', 'Team to confirm the policy; test the agreed behavior in IT-13.'],
    ['F-05', 'Sinhala and Tamil text was written without native-speaker review.', 'Medium / Open', 'Review during E2E-13 and record corrections.'],
    ['F-06', 'Photo retry after a failed upload (v1.0 finding): Create could be pressed again.', 'Low / Fixed', 'Merged from main (version4): a retry now updates the saved listing and uploads only the photos still pending (“Retry Uploads”). Confirm in E2E-05.'],
    ['F-07', 'Dealer profile editing and resubmission after rejection were missing in v1.0.', '— / Resolved', 'Implemented and covered by IT-09, UT-31 and UT-32.'],
    ['F-09', 'Attaching photos to the same upload a second time did nothing: the queue kept the finished job and ignored a new one with the same ID, leaving the status “pending”. Reported by a teammate on main (version4).', 'High / Fixed', 'Finished jobs are now removed and queued again under the same ID (the reaper relies on that ID); covered by UT-41. The teammate’s random-ID fix was not used because it would stop the reaper finding lost jobs.'],
    ['F-10', 'Merging main (version4) into this branch: 16 files conflicted, because both branches built dealer profile editing, resubmission and listing-manager changes. The automatic merge also produced duplicate code that would not compile and a review-history change that would make approvals fail.', 'High (integration) / Resolved', 'This branch’s tested versions kept for the overlapping features; the teammate’s unique fixes (F-06, F-09, ZIP wrapper folders, empty-ZIP message, title restoration, category filter, archived count) ported with tests; full suites rerun (291/291).'],
    ['F-08', 'The photo migration crashed on its first database write: photo keys contain dots, which MongoDB refused inside the update expression. The dry run and the fake-storage tests could not show this. No data was changed.', 'High (tooling) / Fixed', 'Update rewritten to match keys safely; new real-MongoDB test IT-11; migration then completed (0 failures) and a second run changed nothing.']],
    widths=[0.45, 3.1, 1.25, 2.05])

h('4.2 Reporting on Test Coverage', 2)
p('Requirement coverage is tracked in the case register (requirement → case → result → evidence → finding). The table maps each requirement area to its cases. Code line/branch coverage was not collected (no coverage tool is installed), so no percentage is claimed.')
table(['Requirement area', 'Cases', 'Coverage evidence'], [
    ['FR-USER-01–12 / PSR-08–09', 'UT-15, UT-28–30; IT-08; E2E-01, E2E-11; IT-12 planned', 'Authorization, suspension, cache isolation and token handling executed; real Firebase pending.'],
    ['FR-DEALER-01–13', 'UT-04, UT-05, UT-31, UT-32; IT-01, IT-05, IT-09; E2E-02, E2E-03', 'Application, documents, review, resubmission and profile editing executed at API level; browser pending.'],
    ['FR-MARKET-01–16', 'UT-08–11, UT-21, UT-36; IT-03, IT-04, IT-10; E2E-04, E2E-05, E2E-07', 'Lifecycle, uniqueness, photos and details executed; browser pending; F-01 open.'],
    ['FR-UPLOAD-01–08', 'UT-06, UT-07, UT-33, UT-41; IT-14 planned; E2E-06', 'Validation, acceptance, retry and publish-all executed; live queue-to-worker run pending.'],
    ['FR-ETL-01–33 / RR-02–08', 'UT-16–25; IT-03, IT-07; E2E-A1; NF-01', 'Pipeline, leases, idempotency, retries, reaper, crash recovery and throughput executed.'],
    ['FR-SEARCH-01–20', 'UT-12, UT-14; IT-10; E2E-A2, E2E-07; IT-15, NF-06 planned', 'Analysis, filters and live search executed; relevance dataset pending.'],
    ['FR-NOTIFY-01–07', 'UT-25, UT-27; E2E-10, E2E-14; IT-13 planned', 'Outbox retries and reminders executed; real SMTP pending; F-04 decision.'],
    ['FR-ADMIN-01–10', 'UT-03, UT-35; IT-02, IT-05, IT-09; E2E-02, E2E-11', 'Approvals, monitoring filters, audit and moderation executed at API level.'],
    ['UR-01–18', 'UT-36–40; E2E-07, E2E-12, E2E-13', 'Component behavior executed; visual and usability checks pending.'],
    ['PSR-01–07', 'NF-01, NF-02, NF-03; E2E-A2', 'PSR-05 met; latency indicative only; load test pending.'],
    ['PSR-10–16 / RR-09–10', 'UT-01, UT-02, UT-05, UT-09, UT-10, UT-26; IT-05, IT-06, IT-11; NF-04, NF-05', 'Input safety, rate limits, document retention, guards and CI scans executed.'],
    ['Extensions (mobile, languages, discovery, compare, stale, bulk, small copies)', 'UT-11, UT-13, UT-27, UT-33, UT-34, UT-36–40; IT-10; E2E-07–10, E2E-12, E2E-13, E2E-15', 'All automated cases executed and passed; browser journeys pending.']],
    widths=[1.7, 2.6, 2.55])
p('Pass rate = passed ÷ executed. Not-executed cases are reported separately and never raise the pass rate. A case group and its individual tests are two views of the same work and are not added together.')

# ---------------------------------------------------------------- 5
h('5. Risks, Dependencies, Assumptions, and Constraints')
table(['Risk / likelihood / impact', 'Mitigation strategy', 'Contingency'], [
    ['Tests touching a real database / Low / Critical', 'Test database guard (motorx_test on a local host only); separate compose project; serial execution.', 'Stop, check the target, restore only test fixtures.'],
    ['Browser journeys not finished before submission / Medium / High', 'Journeys scripted step by step and assigned per member (3.8); automated journeys already cover the API behavior.', 'Report unexecuted journeys honestly with the automated evidence.'],
    ['Demo photos not loading (F-01) / Observed / High', 'Recover the 78 original files, or re-upload photos for the demo listings, then rerun the smoke test.', 'Demonstrate with listings whose photos load; explain F-01.'],
    ['External services (Firebase, Atlas, SMTP, embeddings) unavailable / Medium / High', 'External calls replaced in automated tests; readiness endpoint; fallback search; email outbox retries.', 'Show the automated evidence; retry the live checks when service returns.'],
    ['Internet or DNS drop during live tests / Observed / Medium', 'The backend refuses to start without Atlas (observed on 26 Sep); isolated test stack needs no internet.', 'Wait for connectivity, restart the backend, rerun the smoke test.'],
    ['Replaced dependencies hide integration faults / Medium / High', 'HTTP journeys use the real app and database; smoke and browser journeys use real Firebase and storage.', 'Treat IT-12 to IT-15 as required before claiming full integration.'],
    ['Laptop resource limits / Observed / Medium', 'Frontend tests limited to two workers; tests run in Docker one file at a time.', 'Close other applications; rerun.'],
    ['Translation quality (F-05) / Medium / Medium', 'Native-speaker review in E2E-13.', 'Fall back to English for any unreviewed text.'],
    ['Sensitive artifacts / Low / High', 'Synthetic data only; secrets never printed; smoke is read-only.', 'Remove and regenerate any artifact containing personal data.']],
    widths=[2.0, 2.65, 2.2])
p('Dependencies: Docker Desktop; locked npm packages; internet for Atlas and Firebase during live checks; team availability for browser journeys. Assumptions: the team keeps the M1/M2/M3 ownership in team-work-plan.md; the test Firebase project is separate from any production project. Constraints: no automated browser suite (Playwright proposed); no code-coverage tool installed; load testing and production (AWS/CloudFront) checks outside this run.')

# ---------------------------------------------------------------- 6
h('6. References')
for ref in [
    '[1] Group 23, “MotorX Software Requirements Specification,” v1.0, 9 Aug. 2026. Repository file: Gropu23_SRS.pdf, sections 2–5.',
    '[2] Group 23, “MotorX Software Architecture Document.” Repository file: Group23_SAD.pdf.',
    f"[3] Group 23, MotorX source repository, commit {meta['revision']}. README.md; docs/RESILIENCE.md; docs/api-contract.md; compose.test.yml; .github/workflows/ci.yml.",
    '[4] Vitest, “Getting Started.” Available: https://vitest.dev/guide/ (Accessed on 26 Sep. 2026).',
    '[5] Microsoft, “Playwright — Installation.” Available: https://playwright.dev/docs/intro (Accessed on 26 Sep. 2026). Proposed for automating Section 3.4.',
    '[6] Docker, “Docker Compose.” Available: https://docs.docker.com/compose/ (Accessed on 26 Sep. 2026).',
    '[7] Google, “Introduction to Firebase Local Emulator Suite.” Available: https://firebase.google.com/docs/emulator-suite (Accessed on 26 Sep. 2026).',
    '[8] Testing Library, “React Testing Library.” Available: https://testing-library.com/docs/react-testing-library/intro/ (Accessed on 26 Sep. 2026).',
    '[9] ladjs, “supertest.” Available: https://github.com/ladjs/supertest (Accessed on 26 Sep. 2026).',
    '[10] Grafana Labs, “k6 documentation.” Available: https://grafana.com/docs/k6/latest/ (Accessed on 26 Sep. 2026). Proposed load-testing tool.',
    '[11] Google, “Lighthouse overview.” Available: https://developer.chrome.com/docs/lighthouse/overview (Accessed on 26 Sep. 2026).',
    '[12] IEEE, “IEEE Standard for Software and System Test Documentation,” IEEE Std 829-2008, 2008.',
    '[13] Supplied “6 Template for Test plan.docx,” Rational Unified Process master test-plan template.',
    f'[14] MotorX test evidence, {DATE_SHORT}: docs/test-evidence (backend/worker/frontend JSON results, automated-test-register.csv, benchmark-output.txt, live-smoke-output.txt, build-output.txt, run-metadata.json).']:
    p(ref)

# ---------------------------------------------------------------- outputs
for path, rows in [(OUT / 'MotorX_Test_Case_Register.csv', cases), (EVIDENCE / 'automated-test-register.csv', automated_rows)]:
    with path.open('w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
assert len(automated_rows) == TOTAL, (len(automated_rows), TOTAL)

doc = Document(ROOT / '6 Template for Test plan.docx')
body = doc._element.body
for element in list(body):
    if element.tag != qn('w:sectPr'):
        body.remove(element)
for section in doc.sections:
    section.page_width = Inches(8.27); section.page_height = Inches(11.69)
    section.top_margin = Inches(.7); section.bottom_margin = Inches(.65)
    section.left_margin = Inches(.7); section.right_margin = Inches(.7)
    section.header_distance = Inches(.25); section.footer_distance = Inches(.25)
    for container in (section.header, section.footer):
        for el in list(container._element):
            container._element.remove(el)
    hp = section.header.add_paragraph('MOTORX  |  MASTER TEST PLAN AND EVALUATION REPORT')
    hp.style = 'Normal'; hp.runs[0].font.size = Pt(8); hp.runs[0].font.color.rgb = RGBColor.from_string('52667A')
    fp = section.footer.add_paragraph(f'Group 23 • Version {VERSION} • {DATE}     |     Page ')
    fp.runs[0].font.size = Pt(8)
    fld = OxmlElement('w:fldSimple'); fld.set(qn('w:instr'), 'PAGE'); fp._p.append(fld)
normal = doc.styles['Normal']; normal.font.name = 'Calibri'; normal.font.size = Pt(10)
normal.paragraph_format.space_after = Pt(6); normal.paragraph_format.line_spacing = 1.08
for n, size in [(1, 17), (2, 13), (3, 11)]:
    style = doc.styles[f'Heading {n}']; style.font.name = 'Calibri'; style.font.size = Pt(size)
    style.font.color.rgb = RGBColor.from_string('17365D'); style.font.bold = True
    style.paragraph_format.space_before = Pt(12); style.paragraph_format.space_after = Pt(6)
    style.paragraph_format.keep_with_next = True
    if style.element.pPr is not None:
        num = style.element.pPr.find(qn('w:numPr'))
        if num is not None:
            style.element.pPr.remove(num)
doc.core_properties.title = 'MotorX Master Test Plan and Evaluation Report'
doc.core_properties.author = 'Group 23'
doc.core_properties.last_modified_by = 'Group 23'
doc.core_properties.revision = 2
doc.core_properties.subject = 'Unit, integration and end-to-end testing'
doc.core_properties.comments = 'Generated by docs/build_test_plan.py from the supplied template and recorded test evidence.'
doc.add_paragraph('MOTORX', 'Title')
doc.add_paragraph('Master Test Plan\nand Test Evaluation Report', 'Subtitle')
doc.add_paragraph('Unit • Integration • End-to-End Testing')
doc.add_paragraph(f'Group 23\nVersion {VERSION}\n{DATE}')
doc.add_paragraph(f'{TOTAL} automated tests executed and passed. Live-stack smoke executed. Browser journeys specified for manual execution.')
doc.add_page_break()
md = ['# MotorX — Master Test Plan and Test Evaluation Report', '', f'Version {VERSION} • Group 23 • {DATE}', '']
for b in blocks:
    if b[0] == 'h':
        _, level, text = b
        if level == 1 and text[:2] in ['1.', '2.', '3.', '4.', '5.', '6.']:
            doc.add_page_break()
        doc.add_heading(text, level)
        md += ['#' * (level + 1) + ' ' + text, '']
    elif b[0] == 'p':
        doc.add_paragraph(b[1]); md += [b[1], '']
    elif b[0] == 'code':
        para = doc.add_paragraph()
        r = para.add_run(b[1]); r.font.name = 'Consolas'; r.font.size = Pt(8)
        md += ['```powershell', b[1], '```', '']
    else:
        _, headers, rows, widths = b
        t = doc.add_table(rows=1, cols=len(headers))
        try:
            t.style = 'Table Grid'
        except KeyError:
            pass
        t.autofit = False
        widths = widths or ([1.45, 5.4] if len(headers) == 2 else [1.8, 2.75, 2.3] if len(headers) == 3 else [6.85 / len(headers)] * len(headers))
        for c, w in zip(t.columns, widths):
            c.width = Inches(w)
        for c, text in zip(t.rows[0].cells, headers):
            c.text = text
            shade = OxmlElement('w:shd'); shade.set(qn('w:fill'), '17365D'); c._tc.get_or_add_tcPr().append(shade)
            for r in c.paragraphs[0].runs:
                r.font.bold = True; r.font.color.rgb = RGBColor(255, 255, 255)
        repeat = OxmlElement('w:tblHeader'); t.rows[0]._tr.get_or_add_trPr().append(repeat)
        for values in rows:
            cells = t.add_row().cells
            for c, text in zip(cells, values):
                c.text = str(text)
        for row in t.rows:
            for c, w in zip(row.cells, widths):
                c.width = Inches(w)
            no_split = OxmlElement('w:cantSplit'); row._tr.get_or_add_trPr().append(no_split)
            for cell in row.cells:
                for para in cell.paragraphs:
                    para.paragraph_format.space_after = Pt(4); para.paragraph_format.space_before = Pt(3)
                    for run in para.runs:
                        run.font.name = 'Calibri'; run.font.size = Pt(9)
        doc.add_paragraph().paragraph_format.space_after = Pt(2)
        clean = lambda v: str(v).replace('|', '/').replace('\n', '<br>')
        md += ['| ' + ' | '.join(map(clean, headers)) + ' |', '| ' + ' | '.join(['---'] * len(headers)) + ' |']
        md += ['| ' + ' | '.join(map(clean, r)) + ' |' for r in rows]
        md += ['']
docx_path = OUT / 'MotorX_Test_Plan_Report.docx'
try:
    doc.save(docx_path)
except PermissionError:
    docx_path = OUT / 'MotorX_Test_Plan_Report_v2.docx'
    doc.save(docx_path)
    print('The report is open in Word, so it was saved as', docx_path.name)
(OUT / 'MotorX_Test_Plan_Report.md').write_text('\n'.join(md), encoding='utf-8')
print(f'Created {docx_path.name}; {len(cases)} cases; {len(automated_rows)} executed automated tests.')
