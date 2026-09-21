# MotorX Individual Demonstration Script — Backend, ETL, Search and Delivery

## Purpose

This is a six-minute individual demonstration script for the following contribution area:

> Backend and ETL engineering: Express REST APIs, MongoDB schemas, BullMQ queues, CSV and ZIP pipeline workers, Docker Compose, Vitest tests, CI/CD, and the MotorX smart-search subsystem.

The script is intentionally centered on one traceable story:

```text
Dealer CSV/ZIP
  -> Express authentication and validation
  -> S3-compatible object storage + MongoDB upload job
  -> BullMQ job ID in Redis
  -> worker streaming ETL batches
  -> normalize + validate + deduplicate + embed + persist
  -> active vehicle listing
  -> buyer structured/hybrid search
  -> CI verification and immutable release deployment
```

## Before the session

### Prepare the data

Have these ready before your six minutes begin:

- One already completed CSV upload containing valid, invalid, and duplicate rows.
- Its Upload Details page showing processed, accepted, rejected, and duplicate counts.
- One rejected-record view showing row number and validation error.
- One completed ZIP image upload if image processing is part of the demonstration.
- Active marketplace records matching `automatic SUV under 8m near Colombo`.
- A Toyota Corolla record for the typo query `toyata corola automatic`.

Do not wait for a large CSV or ZIP to finish live. Show a prepared completed upload and explain that processing was asynchronous.

### Open these tabs in this exact order

1. A single architecture slide containing the diagram above.
2. MotorX dealer Upload Details page.
3. MotorX marketplace.
4. `apps/backend/src/app.ts`.
5. `apps/backend/src/modules/inventory/inventory.service.ts`.
6. `apps/backend/src/modules/inventory/inventory.queue.ts`.
7. `apps/worker/src/services/uploadJob.service.ts`.
8. `apps/worker/src/pipeline/extract.ts`.
9. `apps/backend/src/modules/search/search.service.ts`.
10. `.github/workflows/ci.yml`.
11. `.github/workflows/deploy.yml`.
12. The latest successful GitHub Actions CI run.
13. The latest successful deployment run only if an actual production deployment exists.

Place bookmarks at the exact functions you will discuss. Do not search for files or scroll through entire files during the demonstration.

### Prepare two terminals

Terminal 1 — service evidence:

```powershell
docker compose ps
Invoke-RestMethod "http://localhost:3000/health/live" | ConvertTo-Json -Depth 5
```

Terminal 2 — focused tests:

```powershell
npm.cmd run test --workspace @motorx/backend -- --run src/modules/search/search.queryAnalyzer.test.ts src/modules/marketplace/listing.validation.test.ts
npm.cmd exec --workspace @motorx/worker -- vitest run src
```

Run these before the session and leave the passing summaries visible. Live re-execution is optional if the evaluator asks.

### Keep backup evidence

Keep screenshots of:

- Completed upload counts.
- Rejected rows.
- Search response metadata.
- Passing tests.
- Successful CI jobs.
- Successful ECS deployment and health check, if deployment has actually occurred.

## Exact six-minute script

## 0:00–0:25 — Introduce the contribution

### Show

Architecture slide.

### Say

> Good morning. My contribution is the backend and ETL engineering of MotorX, including Express REST APIs, MongoDB data models, asynchronous BullMQ processing, CSV and ZIP workers, Docker-based environments, automated tests, CI/CD, and the smart-search subsystem. I will demonstrate one complete path from dealer inventory ingestion to buyer search, then show how the same code is tested and released.

Do not list every endpoint or technology beyond this. Move immediately to architecture.

## 0:25–0:55 — System design and architecture

### Show

Point through the architecture diagram from left to right.

### Say

> I separated synchronous request handling from expensive inventory processing. Express authenticates and validates the dealer request, stores the original object, creates a durable MongoDB upload record, and publishes only that record ID to BullMQ in Redis. A separate worker claims the job atomically, streams and processes bounded CSV batches, and persists valid listings and rejected records. This keeps API response time independent of file size and lets the backend and worker scale separately. The resulting listing representation is also used by the search subsystem.

### Design points to emphasize

- Backend and worker are separate deployable processes.
- MongoDB is the durable job state; Redis transports work.
- Original files live in S3/MinIO rather than Redis or MongoDB.
- Shared contracts prevent backend and worker validation from diverging.

## 0:55–1:35 — Express REST API and MongoDB design

### Show

First show `apps/backend/src/app.ts`, specifically the `/api/v1/search`, `/api/v1/listings`, and `/api/v1/dealer/uploads` mounts. Then switch to `inventory.service.ts`, `createInventoryUpload`.

### Say

> The backend is a modular monolith. Each feature follows route, validation, controller, service, and repository boundaries. Dealer upload routes are protected by Firebase verification, local-user loading, authentication, and dealer-role authorization. In this service, the API performs inexpensive CSV checks, sanitizes the filename, stores the file, creates the MongoDB upload job, and then enqueues it.

Point to both compensation blocks.

> I added compensating cleanup: if MongoDB creation fails, the stored object is deleted; if queue publication fails, both the pending job and stored object are cleaned up. This avoids orphaned storage and inconsistent job state.

### MongoDB sentence

> MongoDB schemas enforce enums, bounds, timestamps, indexes, lifecycle status, and dealer ownership. Rejected rows are stored separately with their original row, row number, reason, and validation errors, so one bad record does not reject the complete batch.

## 1:35–2:35 — BullMQ and the ETL/ZIP pipeline

### Show

Show `inventory.queue.ts`, then the completed Upload Details page, then `uploadJob.service.ts` and `extract.ts`.

### Say

> The BullMQ message contains only the durable upload ID, not CSV content. The job ID is also the BullMQ ID, which prevents duplicate queue entries for the same upload. The worker validates the payload and atomically changes a job from pending to processing, so duplicate delivery cannot process it twice.

Point to the pipeline functions.

> The CSV is downloaded as a Node stream and parsed into configurable bounded batches. Each row is normalized, validated with the same shared Zod vehicle schema used by manual listing creation, and duplicate-checked using a normalized registration number. Valid rows receive ownership fields and search embeddings and are inserted as drafts. Invalid and duplicate rows are preserved for correction. Progress counters are updated after each durable batch.

Show the completed counts in the UI.

> Here the dealer can see the terminal status and the exact accepted, rejected, and duplicate counts instead of waiting on one long HTTP request.

If demonstrating ZIP:

> ZIP processing is a second job. Folder names are normalized registration numbers and are matched only against listings created by this exact upload job. File type, size, and per-listing image capacity are enforced before images are written to S3-compatible storage. This prevents one dealer or upload from attaching images to unrelated listings.

If time is below 2:20, omit the ZIP paragraph.

## 2:35–3:40 — Smart-search contribution

### Show

Marketplace first. Search for:

```text
automatic SUV under 8m near Colombo
```

Then, if inventory supports it:

```text
toyata corola automatic
```

Open the network response or prepared JSON showing `interpreted`, `correctedTerms`, `mode`, and `durationMs`. Then show `search.service.ts`.

### Say

> I implemented smart search as a dedicated backend module rather than adding more conditions to the buyer controller. This query is converted into hard filters: car, SUV, automatic, maximum price eight million, and Colombo. The second example demonstrates bounded edit-distance correction from “toyata” and “corola” to Toyota Corolla.

Point to the mode branch and concurrent promises.

> Fully interpreted queries use structured MongoDB filtering directly. When meaningful intent remains, the service runs structured candidate retrieval and query embedding/vector retrieval concurrently. It merges candidates by listing ID, reapplies every hard filter, and calculates 65 percent semantic similarity plus 35 percent lexical matching. Work is bounded to 300 structured and 200 vector candidates.

Point to the caught vector branch.

> Atlas or embedding-provider failure is not allowed to take down marketplace discovery. The optional semantic branch degrades to lexical fallback and reports the actual mode. Every path begins with active status, so draft, sold, or archived inventory cannot leak to buyers.

### Important demo restriction

Do not use `BWM` as the typo example until the short-token transposition fix is implemented. The current matcher deliberately ignores tokens shorter than four characters, so `BWM` is not corrected to `BMW`.

## 3:40–4:20 — Docker Compose and testing

### Show

Show the prepared `docker compose ps` and test summaries. Briefly show `compose.yml` only if needed.

### Say

> For reproducible environments, Docker Compose defines separate frontend, backend, worker, Redis, and MinIO services with a shared network, persistent development volumes, health checks, and service dependencies. Production uses Atlas externally, while MinIO provides a local S3-compatible API. Development overrides enable source watching, and the production frontend uses a multi-stage build with Nginx and its own health endpoint.

Point to passing results.

> The current focused verification passes 17 backend search and listing-validation tests and 35 worker source tests. The worker tests cover extraction, normalization, transformation, category validation, orchestration, and ZIP image processing. Tests isolate external behavior with mocks, while repository tests use a test MongoDB where required.

Do not say “CI runs all worker tests” until the package-script issue listed below is fixed.

## 4:20–5:25 — CI/CD and release deployment

### Show

GitHub Actions successful CI run, followed by `.github/workflows/ci.yml`. Then show the deployment workflow or an actual successful deployment.

### Say

> My contribution to CI/CD was to make verification match the application architecture. On pushes and pull requests, GitHub Actions creates an isolated Ubuntu runner and MongoDB 7 test service, installs locked dependencies with `npm ci`, fails on high-severity dependency vulnerabilities, validates Docker Compose, builds shared contracts first and then all three applications, runs tests, and builds backend, worker, and frontend Docker images. Docker builds are a matrix stage and run only after code verification succeeds.

Point to concurrency and permissions.

> New commits cancel obsolete CI runs, workflow permissions are read-only, and images are tagged with the commit SHA for traceability.

Switch to `deploy.yml`.

> The production workflow starts only after successful CI on main. It checks out the exact tested commit, obtains short-lived AWS credentials through GitHub OIDC instead of long-lived access keys, publishes immutable commit-SHA images to ECR, updates separate ECS worker, backend, and frontend services, waits for service stability, and verifies the production health endpoint. ECS rolling deployment and circuit-breaker configuration provide rollback when a service cannot become healthy.

### Deployment honesty rule

If an AWS deployment has not actually completed, replace the final two sentences with:

> I implemented and documented the release workflow, but the repository documentation explicitly separates workflow readiness from the one-time AWS provisioning. I would describe this as deployment-ready code, not claim that it is currently deployed. The remaining operational work is ECR, ECS, networking, Secrets Manager, environment protection, and the Atlas vector index.

Never claim a production release without showing a successful deployment run and health check.

## 5:25–5:55 — Industry practices and engineering decisions

### Show

Return to the architecture slide or remain on the successful pipeline.

### Say

> The industry practices I adapted are separation of concerns, schema-first validation, least-privilege authentication and deployment, asynchronous bounded-memory processing, idempotent job claiming, compensating cleanup, explicit lifecycle states, durable progress, graceful degradation, health checks, immutable artifacts, locked dependencies, automated security auditing, and observable failure records. I also kept listing and query embeddings on one shared 384-dimensional contract so semantic comparison remains consistent.

## 5:55–6:00 — Close

### Say

> In summary, my work connects reliable dealer ingestion to safe buyer retrieval and carries the same architecture through testing, containers, and release automation. Thank you.

Stop. Do not add an unplanned conclusion after the six-minute mark.

## The three best code snippets to show

If the evaluator allows only three code views, use these:

### 1. Asynchronous upload boundary

File: `apps/backend/src/modules/inventory/inventory.service.ts`

Show `createInventoryUpload` because it proves:

- validation;
- secure storage key creation;
- MongoDB job creation;
- BullMQ publication;
- compensating cleanup.

### 2. Streaming worker orchestration

Files:

- `apps/worker/src/services/uploadJob.service.ts`
- `apps/worker/src/pipeline/extract.ts`

Show `extractCsvBatches` and `processInventoryBatch` because they prove:

- streaming rather than whole-file loading;
- bounded batches;
- normalization and validation;
- duplicate separation;
- parallel valid/rejected persistence;
- durable progress.

### 3. Search decision and ranking

File: `apps/backend/src/modules/search/search.service.ts`

Show `searchListings` because it proves:

- structured versus relevance mode;
- concurrent candidate/vector retrieval;
- semantic fallback;
- ID-based merge;
- filter enforcement;
- 65/35 ranking;
- pagination and search metadata.

## Likely evaluator questions

### Why did you use BullMQ instead of processing the CSV in Express?

> CSV parsing, validation, database writes, embeddings, and notifications can outlive an HTTP request. BullMQ lets the API acknowledge the upload quickly and lets the worker scale and fail independently. MongoDB stores durable job progress, while Redis only transports the job ID.

### What happens if the same queue job is delivered twice?

> The BullMQ job uses the upload ID, and the worker atomically claims only a MongoDB job whose status is pending. A second delivery cannot claim a job already processing or completed.

### Why stream CSV but buffer ZIP?

> CSV row count can be large, so streaming and bounded batches control memory. ZIP size is capped by the backend before enqueueing, and random archive access is simpler after buffering. The two choices are based on boundedness and access pattern.

### How do you ensure manual listings and CSV listings validate the same way?

> Both import shared category-discriminated Zod schemas from `@motorx/shared-contracts`. Conditional rules such as engine capacity or battery fields therefore have one source of truth.

### How are duplicates detected?

> Registration numbers are normalized and checked both within the current upload and against currently draft or active listings. This is stronger than comparing make, model, year, or title.

### What happens to one invalid CSV row?

> It becomes a rejected-record document containing row number, original data, reason, and errors. Valid rows continue through the pipeline, and the job becomes `completedWithErrors` rather than failing the whole file.

### How is ZIP ownership protected?

> ZIP folders are matched only against listings whose `sourceUploadJobId` equals this exact job. Even a valid registration number from another dealer or upload cannot receive the images.

### Why modular monolith rather than microservices?

> The domain size and team do not justify distributed service complexity. Feature modules keep internal boundaries clear, while the worker is separated only where asynchronous scaling and failure isolation provide real value.

### Why rule-based query interpretation instead of an LLM?

> Price, year, transmission, and similar constraints must be deterministic and testable. A rules engine cannot hallucinate a budget. Embeddings are used for residual meaning after hard constraints have been extracted.

### What does hybrid search mean here?

> It combines Atlas vector similarity at 65 percent with exact lexical token/phrase matching at 35 percent, after enforcing structured filters. If vector retrieval fails, the service continues in lexical-fallback mode.

### What is the difference between CI and CD in this project?

> CI verifies a commit: dependency audit, Compose validation, builds, tests, and image builds. CD takes a successfully tested main commit, publishes immutable images, updates ECS services, waits for stability, and verifies production health.

### Why use GitHub OIDC with AWS?

> OIDC issues short-lived credentials scoped to the workflow and repository. It avoids storing a permanent AWS access-key ID and secret in GitHub.

### How would you roll back?

> ECS deployment circuit breakers can automatically return an unhealthy service to its last stable task definition. Because ECR images use immutable commit-SHA tags, a known-good task-definition revision identifies the exact artifact to redeploy.

### What would you improve next?

> First I would correct short transposition typos such as BWM to BMW, execute worker tests through the standard package script in CI, repair the test Compose MongoDB definition, add a relevance threshold, and add Atlas-backed search integration and frontend E2E tests.

## Mandatory fixes before claiming full readiness

### 1. Worker tests are not currently executed by the package script

The worker contains 35 source test cases, and this direct command passes them:

```powershell
npm.cmd exec --workspace @motorx/worker -- vitest run src
```

However, `apps/worker/package.json` currently defines:

```json
"test": "echo \"No worker tests yet\""
```

The CI command therefore succeeds without running worker tests. Change the script to Vitest and add a worker Vitest configuration that includes only `src/**/*.test.ts`, so compiled `dist` tests are not executed a second time.

### 2. The test Compose overlay does not define a complete MongoDB service

`compose.test.yml` configures `mongodb`, but the base `compose.yml` currently has no `mongodb` image/build definition. Combining the files fails with:

```text
service "mongodb" has neither an image nor a build context specified
```

Add `image: mongo:7` and the appropriate health/dependency configuration, or create a self-contained test Compose file. CI currently validates only the base Compose configuration, so it does not detect this overlay problem.

### 3. `BWM` is not corrected to `BMW`

The current fuzzy matcher ignores tokens shorter than four characters. Add a conservative alias or Damerau-Levenshtein transposition rule, a regression test, and correction feedback in the UI.

### 4. Do not overstate Docker hardening

The production frontend correctly uses a multi-stage Nginx image and `npm ci`. Backend and worker Dockerfiles currently use `npm install`, run as the default root user, and retain more build content than a hardened multi-stage runtime image would require. Recommended follow-up:

- use `npm ci` with the lockfile;
- use multi-stage build/runtime images;
- install production dependencies only in runtime;
- run as a non-root user;
- add container health handling where appropriate;
- pin/scan base images.

### 5. Distinguish implemented CD from an actual release

The deployment workflow is implemented, but production is real only after AWS resources, protected environment variables, secrets, networking, services, Atlas, and a successful health-checked workflow run exist. Show evidence or say “deployment workflow implemented; provisioning remains.”

## Final rehearsal checklist

- [ ] The script takes between 5:35 and 5:55 in rehearsal.
- [ ] All browser sessions and dealer permissions work.
- [ ] Completed upload evidence is already loaded.
- [ ] Search demo inventory is known in advance.
- [ ] Code bookmarks are prepared.
- [ ] Test output is already visible.
- [ ] GitHub Actions page is already authenticated and loaded.
- [ ] You know whether deployment is actual or only workflow-ready.
- [ ] You do not use `BWM` before fixing it.
- [ ] You do not claim the current worker package script runs tests.
- [ ] You finish at six minutes and wait for evaluation questions.
