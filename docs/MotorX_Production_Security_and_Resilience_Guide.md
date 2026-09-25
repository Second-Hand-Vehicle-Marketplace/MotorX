# MotorX
## Production Security and Fault Tolerance

Practical implementation guide for an AWS EC2 deployment

Prepared: 24 September 2026 | Version 1.0

This guide explains the selected security recommendations and all selected fault-tolerance and recovery recommendations. It is tailored to MotorX running on EC2 with Docker, MongoDB Atlas, Redis/BullMQ and S3-compatible storage.

The document separates what the local source code already implements from what must be configured, deployed and demonstrated in AWS. It includes failure examples, implementation choices, acceptance checks and an ordered rollout plan.

**Scope and evidence.** The local working tree was inspected while preparing this document. Live EC2, Atlas, security groups, backups and deployed image versions were not inspected. Tests in this guide are proposed acceptance tests, not reported passes. No application code or cloud resources were changed to produce this document.

**Important update to the earlier advice.** The current local project now targets Node 24, binds development ports to localhost, and validates MongoDB configuration in production mode. Earlier statements that these changes were absent no longer describe the current local files. Deployment and runtime verification are still required.

**How to use this guide.** Read sections 1–5 for the immediate EC2 security decisions, sections 6–11 for reliable processing, and sections 12–17 for infrastructure, recovery and validation. The references and glossary are at the end.

@@page
# 1. What “production ready” means for MotorX

A production service must protect customer data, produce correct results when operations are repeated, recover from failures within agreed limits, and make failures visible to an operator. A successful Docker build proves that images can be built. A running website proves that one request path currently works. Neither establishes those broader properties.

**Security** controls who can reach the system and what an authenticated person can do. **Fault tolerance** keeps processing correct when a component fails. **High availability** reduces interruption by providing independent replacement capacity. **Disaster recovery** restores service and data after a larger failure or accidental deletion. These capabilities overlap, but one cannot replace the others.

For example, an Elastic IP gives EC2 a stable address. It does not patch Node.js, restrict Redis, duplicate a worker, back up photographs, or restart the application on a different machine. An encrypted database connection protects data in transit; it does not prevent an authorized but buggy import from deleting records.

## An appropriate first production architecture

```text
Browser --HTTPS--> EC2 reverse proxy (Nginx/Caddy)
                         |--> production frontend
                         |--> backend API
Backend --> private Redis queue --> worker
Backend / worker --> MongoDB Atlas
Backend / worker --> private object storage
Logs / metrics --> monitoring outside the EC2 host
Backups --> storage recoverable without the EC2 host
```

This is a proposed layout, not a verified description of the running server. EC2 with a reverse proxy can support a small production application. ECS, Kubernetes and a paid load balancer are not prerequisites for the three security controls discussed here. A single EC2 host still has an outage when that host fails; accept and document that recovery model or introduce independent hosts.

## Responsibilities and completion criteria

| Area | Responsible work | Evidence of completion |
| --- | --- | --- |
| Application | Correct authorization, bounded operations, safe retries | Automated checks and staged failure tests |
| EC2 and network | Updates, firewall rules, HTTPS, restart behavior | Actual running settings and external connection checks |
| Data services | Access restrictions, backups, recoverability | Restore report and restricted service access |
| Operations | Alerts, release rollback, incident response | Recorded drill with timings and assigned owner |

Treat “configured,” “deployed” and “verified” as separate states. A local change reaches production only after a tested image/configuration is deployed and the actual behavior is checked.

@@page
# 2. Current source-code findings

These observations describe the working tree on 24 September 2026, including existing uncommitted changes. They are not a certification of the deployed EC2 service.

| Topic | Observed locally | Remaining work |
| --- | --- | --- |
| Node runtime | .nvmrc is 24; root package requires >=24 <25; CI and Node image stages target 24 | Build/test and verify the version inside deployed containers |
| Development ports | compose.yml binds published ports to 127.0.0.1 and declares itself development-only | Provide an EC2 production configuration and verify AWS rules |
| MongoDB configuration | Backend and worker call a shared production URI validator | Verify actual credentials, database separation, TLS and Atlas access |
| Job submission | Object storage, MongoDB and Redis are updated sequentially with error cleanup | Recover a crash between durable job creation and enqueue |
| Image replay | Object keys use random UUIDs and metadata is appended | Deduplicate partial work and clean orphaned objects |
| Leases | Fixed five-minute lease; expired processing jobs are reclaimed | Renew leases and fence stale workers |
| Retry behavior | API queue has three attempts with exponential backoff; image errors mark Mongo state failed | Align queue attempts with the durable state machine |
| Readiness | API awaits a Redis INFO request without an explicit route deadline | Bound checks and distinguish process from dependency health |
| Shutdown | API and worker handle termination signals | Add deadlines and prove safe interruption |
| Production docs | CD guide describes ECS and managed services | Adapt operational instructions to the actual EC2 deployment |

## Files used for the assessment

Runtime/network: .nvmrc, package.json, infrastructure/docker/*.Dockerfile, .github/workflows/ci.yml, compose.yml and compose.test.yml.

Database: packages/shared-contracts/src/utils/mongoUri.ts, apps/backend/src/config/env.ts and apps/worker/src/config/env.ts.

Processing: apps/backend/src/modules/inventory/inventory.service.ts; apps/backend/src/config/queue.ts; apps/worker/src/services/imageProcessing.service.ts; apps/worker/src/services/uploadJob.service.ts; apps/worker/src/repositories/uploadJob.repository.ts; apps/worker/src/jobs/reaper.job.ts; apps/worker/src/config/queue.ts.

Lifecycle: apps/backend/src/app.ts, apps/backend/src/server.ts, apps/worker/src/health.ts and apps/worker/src/worker.ts. Deployment intent: docs/CD_GUIDE.md.

The URI validator is a useful startup guard, not proof of security: database names are only a heuristic, and a connection string cannot prove that a credential lacks access to other databases. In particular, explicitly insecure certificate-validation options also need rejection or verification; the inspected guard does not comprehensively check every TLS-related option.

@@page
# 3. Keep the runtime supported

**Meaning.** Node.js is the runtime executing the API and worker. When a release reaches end-of-life, normal upstream maintenance ends. A supported release is part of the production baseline even if the application appears to work. Node 24 is an LTS release at the time of this guide; the previously used Node 20 is end-of-life. [1]

**MotorX status.** The local migration to major version 24 is already represented in .nvmrc, package.json, CI and Dockerfiles. That is progress, but the EC2 containers may still be running an older image. Changing Node on the EC2 host does not change the runtime packaged in an existing container.

## Implementation procedure

1. Keep development, CI and image build stages on the same supported major version. Update related type definitions and dependency constraints as necessary.
2. Run a clean locked dependency installation, then build shared contracts, backend, worker and frontend. Run relevant tests against an isolated test database. Never run destructive database tests against production.
3. Build refreshed images so they include current base-image patches. Record the commit and image digest. A tag such as node:24-alpine can change; reproducible releases need recorded or pinned digests plus a deliberate update process.
4. Exercise Firebase login, database connection, Redis work, CSV import and ZIP processing in staging. Major upgrades can affect dependencies and native modules even when compilation succeeds.
5. Deploy the tested image and inspect the actual containers. Retain the previous known-good release for rollback.

These read-only examples apply when the active Compose project has services named backend and worker; select the actual production Compose file/project first:

```sh
docker compose exec backend node --version
docker compose exec worker node --version
docker compose images
```

## How to know it is complete

The running API and worker report the intended supported runtime, the image digest matches the tested release, and the application's main workflows pass in the deployed environment. The same release information should appear in operational records so a future incident can be tied to a particular image.

Continue scheduled dependency, base-image and host operating-system updates after launch. “Upgraded to Node 24” is a completed migration, not a permanent guarantee. Prioritize security fixes and recheck the upstream support schedule before the chosen line expires.

@@page
# 4. Restrict network access on EC2

**Meaning.** The public website needs a reachable entry point. Redis, the storage console and internal application ports do not all need public entry points. Restriction reduces opportunities to bypass the web layer or attack an administrative service.

Use an EC2 security group as the network boundary and a deliberate Docker port configuration as a second layer. Docker normally publishes an unspecified host binding on all interfaces; localhost bindings restrict access to the host on current Docker versions. Keep Docker patched; its documentation notes older-version caveats. [2]

| Inbound port | Single-EC2 baseline | Purpose |
| --- | --- | --- |
| 443 | Public to the reverse proxy | HTTPS website and API |
| 80 | Optional public redirect/certificate validation | Redirect visitors to HTTPS |
| 22 | Administrator IP only, or closed with an alternative management channel | SSH maintenance |
| 3000 / 4173 | No public access | API / current development frontend mapping |
| 6379 | No public access | Redis queue |
| 9000 / 9001 | No public access in the current API-proxied image design | MinIO API / administration |

Review every security group attached to the instance: an additional permissive group can allow traffic. Check IPv6 rules too if IPv6 is enabled. An open port mapping alone does not prove internet exposure; routes and security-group rules also matter.

## Docker and reverse-proxy choices

Your local compose.yml now binds all these ports to 127.0.0.1. Keep it as a development configuration. Create a separate production configuration using a built frontend, production environment settings, persistent storage and resource limits. Publishing the Vite development server is not the production frontend design already provided by the repository.

If Nginx runs on the EC2 host, it can proxy to a loopback-bound API such as 127.0.0.1:3000. If Nginx runs in Docker, use the backend service name and container port on a shared network; localhost inside that proxy container points to the proxy itself. Redis and MinIO can have no host port mappings when only containers use them.

Before closing existing application ports, configure the proxy, TLS and the frontend API URL and verify a complete browser workflow. Do not break the only management path while changing firewall rules.

**Acceptance check.** From a separate authorized machine, HTTPS works and connections to internal service ports fail. The API and worker still reach Redis/storage internally. Certificate renewal is exercised, and the private MinIO console remains accessible through an authorized tunnel when needed.

@@page
# 5. Secure MongoDB connectivity and stable addressing

**Meaning.** Atlas must admit traffic from the application's actual outbound address, and the application must use an appropriately scoped database identity over TLS. Network admission and database authorization solve different problems. Atlas's IP access list controls cluster connections, not permission to use the Atlas website. [4]

An automatically assigned EC2 public IPv4 address is released on stop/start. An Elastic IP is persistent until released. For an instance reaching the internet directly through its public interface, an associated Elastic IP can provide the stable source address. If traffic exits through a NAT gateway or another egress service, allowlist that outbound address instead. [3]

## Recommended steps for your EC2 setup

1. Confirm in EC2 whether the address is an associated Elastic IP, rather than assuming every public address is static. Document the internet egress path.
2. In Atlas, allow the verified outbound IPv4 address with /32. This means one address. Keep local development access separate and avoid allowing the entire internet as a shortcut.
3. Use a dedicated production database and production database user. Grant only the necessary database permissions; use separate credentials for administration and migrations.
4. Give development/test identities no production access. Separate Atlas projects/clusters offer a stronger boundary when affordable; a different database name alone does not isolate credentials with broad privileges.
5. Keep certificate validation enabled. Do not resolve connectivity failures by turning off TLS or accepting invalid certificates. Store the URI as a secret, avoiding logs and screenshots.
6. Set NODE_ENV=production on both the deployed backend and worker so the current startup guard actually runs.

## What the new local guard does and does not do

The shared mongoUri.ts helper checks the URI shape, requires an explicit database, rejects certain local hosts and development/test names, and requires TLS according to the scheme/options. It catches common configuration mistakes before processing starts. It does not verify the actual route, Atlas firewall, credential permissions or deployment tier. Extend its validation to reject insecure TLS overrides and test malformed/encoded options; do not rely solely on regular-expression naming checks.

**Acceptance check.** Both deployed services connect using their intended production identity. A development identity cannot access production data. A host outside the approved path cannot establish a fresh cluster connection. If testing IP persistence with stop/start, use staging or a planned maintenance window: stop/start itself interrupts the server. Never expose the connection string in the resulting evidence.

Private connectivity is an optional stronger network design where supported. It is not required merely because MotorX uses EC2.

@@page
# 6. Prevent lost jobs between MongoDB and Redis

**The failure.** MotorX first stores an uploaded file, creates a MongoDB job, and enqueues work in Redis. The current code attempts cleanup when a call throws. However, the operating system can stop the process before a catch block runs. MongoDB might then contain a pending upload that was never placed on the queue.

The current reaper looks for expired jobs with a processing status. A pending job that was never claimed has no expired processing lease, so that recovery path does not repair this gap. An Elastic IP, larger EC2 instance, or ordinary queue retry cannot recover work Redis never received.

## Durable dispatch design

Use the upload job itself as a durable dispatch record, or create a separate outbox record atomically with it. An outbox is a database record saying “this work must be sent.” For a separate collection, use a supported MongoDB transaction so job creation and dispatch intent commit together. An embedded dispatch state can be updated atomically in the job document.

```text
Persist file --> commit job + dispatch intent --> acknowledge acceptance
Dispatcher --> enqueue stable job ID --> record dispatch result
Worker --> process idempotently --> persist terminal result
Reconciler --> repair durable nonterminal work missing from the queue
```

The dispatcher must be able to run repeatedly. If it crashes after enqueueing but before recording success, it will try again. A deterministic BullMQ job ID limits duplication while that job remains in Redis, but retained IDs eventually disappear. Durable processing identity and terminal-state checks are still necessary.

Reconcile sufficiently old pending/retryable jobs, with bounded batches and pagination. Inspect queue state before requeueing; never delete active work merely to force a retry. Give dispatch records ownership/leases if multiple dispatchers run. A successfully delivered marker alone is insufficient after Redis data loss: reconcile nonterminal database jobs against missing queue work too.

## File and response handling

Store the object before acknowledging durable acceptance and preserve it until processing or retention policy allows deletion. If the client retries because the HTTP response was lost, a dealer-scoped submission idempotency key should return the existing job rather than create another import. Periodically remove unreferenced objects only after a safety age and reference check.

**Acceptance test.** In staging, kill the API immediately after the MongoDB commit and before Redis enqueue. After recovery, exactly one logical job eventually completes. Repeat with a crash after enqueue but before the dispatch marker update, and with queue data loss. Record that no accepted upload stays pending indefinitely.

@@page
# 7. Make image processing safe to repeat

**Meaning.** Idempotency means retrying the same logical operation produces the same intended durable result. Background jobs may be delivered again after a crash or lost acknowledgement. Design for repeated execution rather than assuming a worker runs exactly once. [6]

**Current MotorX risk.** Each processed image receives a random object key, and image metadata is appended to the listing. If the worker attaches three photos and crashes before marking the job complete, recovery can upload and append those photos again. A ten-image limit caps the count but does not distinguish duplicate photos from missing photos. A crash after object upload and before metadata attachment can also leave an orphaned object.

## A practical design

Give each processing run an immutable input identity, including the upload ID and ZIP version or content hash. For each image, derive an identity from that run, the target listing, normalized archive entry and content hash. Store that identity with the image and use a deterministic, safely encoded object key.

Attach metadata conditionally and atomically: require both that the image identity is absent and that capacity remains. Alternatively use a separate image-operation collection with a unique compound index and an explicit state machine. A separate identity record alone must not mark work done before the listing attachment is durable; transaction or reconciliation logic must close that gap.

Choose a deterministic ordering for entries and a stable duplicate-entry policy. If two images claim the last available slot, the database must enforce the limit atomically. Record rejected/skipped results so a repeated run computes the same counters and dealer-facing explanation.

Deterministic object names help repeat uploads, but do not create a transaction between object storage and MongoDB. Reconcile objects uploaded without a committed attachment. Scope cleanup to the exact run and verify there is no live reference before deletion. For versioned buckets, retries can create extra object versions that also require lifecycle management.

## Apply the same principle beyond images

CSV imports need stable row identities, durable per-row outcomes and correct counters after replay. Checking whether a registration already exists can prevent a second listing while still misclassifying a previously successful row as a new duplicate. Distinguish a replay of this upload from another upload's conflict.

Notification delivery should have its own deduplication identity. An email failure after data completion must not turn the completed import into a failed job or trigger repeat data writes.

**Acceptance test.** Interrupt processing after object upload, after listing attachment and before final completion. On recovery, each intended photo is attached once, counters remain accurate, order is stable, and unreferenced objects are eventually cleaned. Run two workers against the same logical job to verify the atomic rules.

@@page
# 8. Renew leases and reject stale workers

**Meaning.** A lease is a temporary claim to process a job. If the worker dies, the lease expires so another worker can take over. A lease duration must allow recovery without falsely treating legitimate long work as abandoned.

**Current MotorX behavior.** MongoDB leases last five minutes and are not renewed in the inspected code. BullMQ has a separate locking mechanism. Its lock and the MongoDB lease are not the same protection. The current reaper avoids removing an actively locked BullMQ job, but stale MongoDB ownership remains a concern during stalled-job recovery and races.

## Why an expiry alone is insufficient

Worker A claims a job and pauses for a long time. Its lease expires, and worker B claims the job. Worker A then resumes and writes completion or failure. If updates filter only by job ID and status, A can overwrite B's newer work. This is a stale-worker problem, not a problem solved by making every lease very long.

## Recommended ownership model

1. Atomically claim an eligible job and assign a unique attempt token plus a monotonically increasing generation where useful. Record worker identity, stage, start time and expiry.
2. Renew periodically while processing. For illustration, renew every 30 seconds with a two-minute lease, after measuring real pauses and dependency latency. These numbers are starting points, not validated MotorX defaults.
3. Renew only when the stored token still matches the claimant. If renewal fails or ownership is lost, stop accepting new side effects and abandon the attempt safely.
4. Require the token/generation on progress, completion, failure and retry-state updates. A stale worker's update must modify zero records.
5. Fence data writes too. Guarding only the job's completion does not stop stale image attachments. Use idempotent conditional operations, or transactional ownership checks for MongoDB changes, and deterministic identities for external object writes.
6. Give CSV and image stages separate attempt counters and lease state, or explicitly reset and transition them. The current model shares attemptCount and lease fields across stages.

Use consistent time handling, synchronize hosts and avoid overlapping reaper cycles. A reaper must recheck eligibility atomically before reclaiming or failing a job; a snapshot read can become outdated while another worker renews.

**Acceptance tests.** A healthy long-running job exceeding five minutes is not taken over. A dead worker is replaced within the measured lease/reaper window. A paused original worker that resumes after replacement cannot alter the new attempt's outcome. Verify that no worker is permanently stuck because a queue lock and database lease disagree.

@@page
# 9. Retry temporary errors without hiding permanent failures

**Meaning.** A retry is useful when conditions may improve, such as a brief storage timeout. Repeating a malformed ZIP with the same bytes will not repair it. Error classification prevents both unnecessary load and premature failure.

| Failure | Handling | Dealer-facing behavior |
| --- | --- | --- |
| Temporary timeout, throttling or service interruption | Bounded retry with backoff and jitter | Processing delayed; retry scheduled |
| Invalid CSV/ZIP or unsupported content | Terminal validation result | Explain the input correction needed |
| Authentication/permission misconfiguration | Alert operator; avoid a tight retry loop | Service problem, without exposing secrets |
| Repeated temporary failures beyond budget | Failed/reviewable state | Safe retry action after the cause is fixed |

**Current mismatch.** The API queue specifies three attempts and exponential backoff. Image processing catches errors, marks the MongoDB image status failed, then throws. A later BullMQ attempt cannot claim that terminal state, so “queue has retries” does not guarantee real image recovery. The worker's reaper producer also lacks the API producer's shared default options. CSV retryability currently relies on matching words in an error message, which is brittle.

## Recommended state and policy

Use a consistent state model such as pending → processing → retry-wait → processing → completed, or processing → failed for permanent/exhausted failures. Record stage, attempt, next eligible time and a safe error code. Queue and database state must agree on whether another attempt is allowed.

Classify errors using documented provider/driver error types, codes and status information. Retry delays can grow exponentially with a maximum delay and random jitter; jitter spreads requests instead of making all workers hit a recovering service simultaneously. Count total attempts consistently and limit both attempts and elapsed retry time. BullMQ supports attempts, backoff and jitter configuration. [7]

Share job options across enqueue paths. Keep transport retries, job attempts and expired-lease reclaims within a comprehensible total budget. Recover pending jobs left after the last queue attempt instead of leaving them invisible to both the queue and the reaper.

Manual retry must verify dealer/admin authorization, terminal state, retained source files and absence of an active attempt. It should preserve audit history and reuse the same logical identities so completed side effects are not duplicated. Send a final failure notification only when the processing outcome is final; handle email separately.

**Acceptance test.** Make storage fail twice and then recover; the job finishes once. Submit an invalid ZIP; it fails promptly without wasting all transient attempts. Exhaust the retry budget; the UI reports a stable failure and an authorized retry can later recover it safely.

@@page
# 10. Bound health checks and dependency waits

**Liveness asks:** is this process alive and able to execute? **Readiness asks:** should this instance receive a particular class of traffic now? A third useful signal is **progress:** is the worker actually consuming and completing jobs?

MotorX has /health/live and /health/ready. The API's readiness path checks the Mongoose connection state and awaits Redis INFO without an explicit route deadline. The worker health endpoint checks connection states, which are useful indicators but do not prove jobs are making progress. A MongoDB readyState value also does not guarantee that the next operation will succeed.

## Recommended behavior

Use short, inexpensive dependency probes with explicit connection and command deadlines. A small ping is more suitable than gathering broad server information. Set a total health-response budget; one to two seconds is an illustrative starting point. Return 503 promptly when unavailable and keep the endpoint's output free of sensitive details.

A Promise.race timeout alone returns early but can leave the original operation running. Configure actual client command/connect timeouts and bounded outstanding probes too, or repeated checks can accumulate work during an outage. Give user-facing database and object-storage operations sensible deadlines as well.

Keep dependency failures out of basic liveness. Restarting every API instance because Atlas is temporarily unavailable can create a restart storm. Readiness should remove affected traffic while clients reconnect with controlled backoff. Process crashes or a genuinely wedged process need recovery through the supervisor.

Decide whether Redis failure should disable the whole API. In the current code it makes global readiness fail, even though some Mongo-backed browsing may still work. Choose either a simple all-or-nothing policy or an explicit degraded mode that disables uploads while browsing remains available. Test that choice instead of accidentally exposing operations that cannot complete.

## EC2 versus ECS behavior

Docker Compose health checks annotate health; restart policies respond to container exit conditions and do not, by themselves, replace a still-running unhealthy process. Use a deliberate supervisor/watchdog and alerting policy on EC2. Avoid an unconditional “restart on any dependency failure” loop. Docker documents the restart policy semantics. [8]

On a future load-balanced deployment, readiness controls routing and liveness controls process replacement. The same dependency-aware check should not be indiscriminately reused for every purpose.

**Acceptance test.** Interrupt Redis and confirm readiness returns within its deadline without a flood of open operations. The live endpoint remains responsive. Restore Redis and verify automatic recovery. Stop worker consumption while leaving connections open; queue-age/progress monitoring must still detect the problem.

@@page
# 11. Shut down within a deadline and resume safely

**Meaning.** A deployment or host shutdown sends a termination signal. Graceful shutdown gives the application time to finish or checkpoint active work. A deadline prevents the shutdown from waiting forever on an unavailable dependency.

The API currently stops accepting HTTP connections before closing MongoDB and Redis. The worker stops its reaper and calls worker.close() before closing dependencies. These are useful foundations. Neither inspected path provides a complete explicit deadline and forced-exit strategy.

## API shutdown sequence

Mark the instance as draining so readiness stops admitting new traffic. Stop accepting new connections, finish in-flight requests within the request budget, then close clients. Guard against repeated signals so cleanup runs once. If a request cannot finish in time, leave durable processing state recoverable; never report a successful operation before its acceptance is durable.

## Worker shutdown sequence

Stop taking new jobs and prevent new reaper work. Keep active job leases renewed while draining. Finish a short current unit or persist a checkpoint. Close queue and storage/database clients only after processing no longer needs them. If the deadline expires, stop the process and allow lease-based recovery; do not release ownership early while the old worker continues writing.

The orchestrator/Compose stop grace period must exceed the application's own shutdown deadline with a margin. For example, a 45-second application deadline and 60-second supervisor grace could be a starting configuration, but choose values from actual request and batch timings. A job lasting many minutes should be resumable; the deployment should not require waiting for every full archive to complete.

## What a checkpoint must guarantee

Progress is meaningful only if it agrees with committed side effects. Saving “row 500 completed” before rows are durable can lose work; saving it afterwards can cause replay following a crash. Stable row/image identities and atomic updates make that replay safe. Avoid treating in-memory counters as the only truth for the final summary.

Also handle jobs interrupted by SIGKILL or a host power failure, where graceful cleanup never executes. Lease recovery, durable dispatch and idempotency are required even after graceful shutdown is implemented correctly.

**Acceptance test.** Terminate an API with a request in flight and a worker during CSV/ZIP processing. Both exit before the supervisor deadline; accepted work completes or resumes without duplicate records. Repeat with forced termination to demonstrate that correctness does not depend on the cleanup handler running. No manual database edits should be necessary for recovery.

@@page
# 12. Protect infrastructure and choose an availability level

More containers on one EC2 instance can survive a process crash but not the loss of that EC2 host. Moving to two hosts only helps if the database, queue, images, egress and release process do not introduce another shared point of failure.

| Level | Practical design | Remaining limitation |
| --- | --- | --- |
| Initial small deployment | One EC2 host, HTTPS proxy, automatic process restart, off-host backups, external alerts | Host recovery causes downtime |
| Improved recoverability | Reproducible EC2 provisioning, managed object storage, tested restore and replacement procedure | Replacement is still an incident response |
| Higher availability | Multiple API hosts across zones, load balancing, replicated durable services, safe worker concurrency | Shared dependencies and regional failures still need planning |

Choose the level from business downtime tolerance and budget. The selected recommendations do not require an immediate ECS migration. If ECS is adopted later, the application's correctness requirements remain the same.

## Redis is durable work infrastructure

Use a private authenticated Redis endpoint. Encrypt traffic when crossing service/host boundaries, with certificate verification. Configure noeviction so memory pressure does not silently evict queue keys; full memory must trigger an observable capacity problem. Use persistence and backups appropriate to the deployment, and verify supported failover/command behavior for the chosen managed Redis service. BullMQ's production guidance covers persistence, noeviction and connection behavior. [5]

The local Compose configuration enables AOF and appendfsync everysec. That improves process-crash recovery but is not an off-host backup or zero-data-loss guarantee. Queue persistence and database reconciliation complement one another. If the EC2 disk disappears, a Docker volume on that disk does not independently preserve the queue.

API queue producers should fail within a bounded request budget. Worker blocking connections may need unlimited request retries for BullMQ operation; do not copy that worker policy to user-facing HTTP requests. Monitor Redis memory, disk space and connection errors.

## Storage and capacity

Move original archives and photographs to durable storage independent of a single EC2 disk, or operate and back up MinIO deliberately. Keep verification documents private. Limit API upload concurrency and worker concurrency; the current ZIP implementation holds compressed data and extracted images in memory, so simultaneous valid jobs can still exhaust a small host.

**Acceptance check.** Restart Redis, recover from its backup in staging, and reconcile missing jobs. Simulate memory/disk pressure. Verify controlled errors and alerts instead of silently lost work. Only add worker replicas after the ownership and replay tests in sections 7–8 pass.

@@page
# 13. Back up data and prove restoration

**Meaning.** Replication keeps copies available during infrastructure failures; backups preserve recoverable historical states. Replicas can quickly repeat an accidental deletion, so replication does not replace backup.

Define a **recovery point objective (RPO)**: the maximum acceptable lost data. Define a **recovery time objective (RTO)**: the maximum acceptable restoration time, measured from an agreed incident start. A target such as RPO 15 minutes and RTO one hour is a business choice, not a property MotorX currently proves. Daily backups alone cannot satisfy a 15-minute RPO.

| Recoverable item | Protection to configure | Restore validation |
| --- | --- | --- |
| MongoDB data | Scheduled backups and point-in-time recovery where supported | Listings, users, ownership, job states, indexes and counts |
| Images and source archives | Versioning, retention and independent backup/replication as needed | Referenced image versions open and source jobs can resume |
| Redis jobs | Appropriate persistence/backup plus database reconciliation | Nonterminal jobs recover without replay corruption |
| Infrastructure and releases | Versioned configuration and retained image digests | Replacement host can run the intended release |
| Secrets and encryption access | Protected secret recovery and key access procedure | Replacement runtime can authenticate without exposing credentials |

Atlas continuous backup supports restoration to a selected point in time; verify availability and limitations for the actual cluster tier. [9] S3 versioning preserves versions that can help recover overwritten or deleted objects. Versioning alone does not protect against every account compromise or intentional version deletion. [10]

## A restore drill

1. Select a recovery time and restore to an isolated environment, never over the live database for a practice exercise.
2. Restore a compatible application version and its configuration. Disable outgoing email and other live side effects during validation.
3. Recover database data and object versions representing a consistent usable state. A database snapshot and object archive taken at different times may contain missing references; reconcile and report them.
4. Rebuild or validate search indexes and measure the time until search becomes usable. Check dealer access boundaries and a sample of original archives, photos and documents.
5. Reconcile job state against restored queue data before resuming consumption. Prevent old completed jobs from producing duplicate records or notifications.
6. Record recovered timestamp, actual loss, total time, missing objects and operator actions. Compare the results with the RPO/RTO and correct the gaps.

Schedule drills regularly and after major storage/schema changes. Give someone responsibility for failed backup alerts, retention settings and the written recovery procedure. A green backup schedule is not evidence that restoration works.

@@page
# 14. Make EC2 releases reversible

**Meaning.** A production release should identify exactly what changed, prove that critical workflows still work, and provide a tested way to return to a known-good application version. “Pull latest and restart” makes that harder to reproduce.

## A practical EC2 release process

1. Build and test in CI. Tag images with the commit identifier and retain their immutable digests. Record compatible environment/configuration and migration versions.
2. Test in a separate staging environment. Include login, listing reads, authorized updates, CSV acceptance, actual worker completion and image display. A liveness response alone is not release acceptance.
3. Preserve the current release manifest and verify backups before changes that affect durable data. Use an explicit production Compose definition; do not overwrite production settings with the local development file.
4. Pull the new images, apply backward-compatible migrations and replace services with a documented drain procedure. Expect a maintenance interval on a basic single-instance deployment unless parallel deployment is explicitly configured.
5. Perform post-release checks and watch error rate, latency and queue age. Define rollback triggers before the release, such as sustained elevated errors or failed core workflows.
6. If necessary, redeploy the previous image digests and compatible configuration. Verify readiness and a real business operation after rollback.

Do not delete volumes as part of an ordinary rollback. An application rollback is not a database restore. Restoring the database to an old snapshot can discard legitimate transactions written since that snapshot.

## Backward-compatible data changes

Use an expand-and-contract approach: add fields/indexes first, deploy code that tolerates both old and new records, migrate data safely, and remove old representations only after the rollback window closes. New and old workers may overlap briefly during deployment, so queue payloads and processing states also need compatibility.

On a single sufficiently sized EC2 host, two application versions behind a proxy can reduce deployment interruption, but they share host failure risk and consume additional memory. Do not run duplicate workers casually without the idempotency and lease protections already described.

## If you later use ECS

ECS rolling deployments can use a deployment circuit breaker with rollback to a previous successful deployment. [11] This feature is specific to ECS and is not automatically present in your current EC2/Compose deployment. Equivalent EC2 automation must explicitly decide when to roll back and which release to restore.

**Acceptance test.** Deploy a deliberately broken release in staging. The release checks detect it, rollback restores service within the target time, and completed writes/jobs remain intact. Keep the release IDs, timings and health/functional results as evidence.

@@page
# 15. Detect failures before users report them

**Meaning.** Logs explain individual events; metrics reveal trends; alerts call an operator to act. A service can return HTTP 200 while all inventory jobs remain stuck, so monitor both infrastructure and business progress.

| Signal | Example starting alert | Required response |
| --- | --- | --- |
| Public availability | Repeated external HTTPS failures | Check host, proxy, certificate and dependency status |
| API failures and latency | Sustained error/latency increase above baseline | Identify affected route and release; consider rollback |
| Queue age | Oldest eligible job waits beyond the processing objective | Check worker progress, retries and capacity |
| Stuck durable jobs | Old pending/expired jobs survive reconciliation | Inspect dispatch/reaper errors and ownership |
| Worker heartbeat and progress | Missing expected heartbeats or no progress with backlog | Check worker process and dependency access |
| Memory/disk/Redis pressure | Sustained high usage or projected exhaustion | Reduce intake, scale capacity or clean safely |
| Backups and certificates | Failed backup or approaching expiry | Repair before the recovery/renewal window closes |

Thresholds must be tuned to expected traffic and measured processing times. For example, alert on queue wait separately from intentional retry delays; a delayed retry should not look identical to a worker that has stopped consuming.

## Useful event fields

Generate and propagate a request ID and include the upload ID, queue job ID, processing stage, attempt token, release identifier, elapsed time and safe error code where relevant. Bound and validate any client-supplied correlation value. Record job-state transitions so a stuck upload can be reconstructed without guessing from unstructured logs.

Never log authorization headers, full MongoDB URIs, private keys, passwords, document contents or unnecessary personal data. Apply access controls and retention to logs. Keep operational summaries separate from detailed restricted diagnostics. Log rotation prevents a healthy application from filling its disk.

Send logs and alerts outside the single EC2 host so evidence survives a host outage. Test notification delivery to a real responsible operator and assign a backup contact. Every important alert should link to a short procedure: impact, first checks, safe recovery action, escalation and rollback/restore criteria.

## Recovery measurements

Define when incident time starts, when the alert fires, when service is usable again, and what data is missing. Otherwise RTO/RPO reports can conceal detection delays or incomplete restoration. Availability targets should identify covered user journeys, such as browsing and accepting uploads, rather than treating the presence of any responding endpoint as success.

**Acceptance test.** Stop a staging worker with a queued upload. An alert arrives within the chosen detection window, contains enough context to locate the job, and clears after verified processing resumes. Repeat with a simulated host outage and ensure the external monitor still works.

@@page
# 16. Implementation order and ownership

The order below prevents expensive infrastructure changes from hiding correctness problems. It does not require completion of a multi-host migration before basic EC2 security is improved.

| Phase | Work | Exit condition |
| --- | --- | --- |
| 1. Verify the deployed baseline | Node 24 image, HTTPS, actual Elastic IP/egress, security groups, production environment/database identity | Running configuration and external access checks recorded |
| 2. Protect recoverability | Off-host data protection, restore procedure, basic alerts, retained release digests | Successful isolated restore and rollback drill |
| 3. Repair processing correctness | Durable dispatch, idempotent row/image writes, lease tokens/renewal, consistent retry state | Crash/replay and concurrent-worker tests pass |
| 4. Bound resource use | Health/client deadlines, graceful shutdown deadline, upload/concurrency budgets, log rotation | Dependency-outage and load tests remain bounded |
| 5. Improve continuity | Additional hosts/zones and managed service failover if required | Host/zone failure meets the agreed availability objective |

Assign application changes to the developer responsible for inventory/worker processing; assign network, secrets and backup configuration to the deployment operator; assign acceptance evidence and incident drills to a named release owner. On a small team one person can fill multiple roles, but each responsibility still needs an owner.

## A practical pre-launch checklist

- The real EC2 containers use the tested supported runtime; local files alone are not used as evidence.
- The public entry point uses HTTPS and internal services are not publicly reachable.
- Production database access is separate from development/test access and certificates remain validated.
- Accepted uploads cannot remain permanently stranded between database and queue.
- Replaying a CSV or image job produces correct data, counters and notification behavior.
- A dead worker is recovered, and a stale worker cannot modify a replacement attempt's result.
- Temporary failures have bounded retries; permanent failures produce useful safe messages.
- Health checks, requests and shutdown complete within documented budgets.
- Database and image data can be restored together within the measured target.
- A bad release can be rolled back without deleting application data.
- Alerts reach a responsible person even if EC2 is unavailable.

## What is still unknown

The live EC2 security groups, reverse proxy, TLS renewal, Elastic IP association, outbound route, deployed runtime, actual Atlas tier/backup policy and production object-storage location have not been verified in this review. Record these before claiming readiness. Also perform a wider authorization, upload-security and dependency review; this guide thoroughly explains the selected recommendations but is not a full penetration test or compliance assessment.

@@page
# 17. Staging validation matrix

Use synthetic data and an isolated environment. Record the deployed commit/image, configuration, start/end times, expected result, observed result and log evidence for each test. None of the following tests was executed while generating this guide.

| ID | Failure or action | Expected evidence |
| --- | --- | --- |
| S1 | Inspect runtime inside API and worker | Both use the intended supported Node release and tested images |
| S2 | Attempt external access to internal ports | Public HTTPS works; Redis, storage console and internal ports are blocked |
| S3 | Use a development identity against production-like protected data | Access denied; no secrets appear in logs |
| F1 | Kill API after job commit, before enqueue | Dispatcher/reconciler eventually runs the accepted job |
| F2 | Kill dispatcher after enqueue, before acknowledgement | One logical outcome despite redispatch |
| F3 | Kill worker after image object upload | Recovery attaches once or cleans the unreferenced object |
| F4 | Kill worker after image metadata attachment | Replay does not append duplicate photos or inflate counters |
| F5 | Pause worker beyond lease; allow takeover; resume old worker | Old attempt cannot update data or final status |
| F6 | Run a healthy long import beyond the original five minutes | Ownership is renewed without false takeover |
| F7 | Return temporary storage errors, then recover | Bounded retries finish successfully; no duplicate notifications |
| F8 | Submit permanently invalid input | Stable actionable rejection without repeated futile processing |
| F9 | Interrupt Redis and later restore it | Readiness fails promptly, chosen degraded behavior holds, jobs recover |
| F10 | Terminate during processing, then force termination | Deadline respected; durable work safely resumes in both cases |
| R1 | Lose/rebuild queue state with pending jobs in MongoDB | Reconciliation repairs missing work without replaying terminal jobs |
| R2 | Deploy a broken image | Detection and rollback restore the previous working release |
| R3 | Restore database and objects to an isolated environment | Referential integrity, core workflows and measured RPO/RTO pass |
| R4 | Simulate loss of the EC2 host | Off-host alert fires; replacement/restore meets chosen service objective |
| C1 | Submit concurrent maximum-size valid uploads | Memory/disk remain bounded; excess demand gets a controlled response |

A passing health endpoint cannot substitute for the data assertions in these tests. Check listing counts, row outcomes, image identities, object references, job state and notifications. When a result fails, preserve the evidence, fix the underlying state transition and rerun the affected scenarios.

@@page
# 18. Glossary and primary references

| Term | Meaning in this guide |
| --- | --- |
| Elastic IP | Persistent allocated public IPv4 address; does not supply failover by itself |
| Egress | Network path and source address used for outbound connections |
| Outbox | Durable record of work that still needs dispatch to another system |
| Idempotency | Repeating the same logical operation preserves the intended final result |
| Lease / fencing | Temporary ownership / rejection of writes from an outdated owner |
| Backoff / jitter | Increasing retry delay / randomness that spreads retries over time |
| Liveness / readiness | Process health / ability to receive the intended traffic |
| RPO / RTO | Acceptable lost-data interval / acceptable restoration time |
| Reconciliation | Comparing durable records across systems and repairing discrepancies |

Sources were consulted on 24 September 2026. Provider capabilities depend on configuration, service tier and future changes. Numbered references support provider behavior; MotorX-specific observations come from the local files listed in section 2. Proposed algorithms, thresholds and tests are engineering recommendations for this application, not claims that the current code already implements them.

[1] Node.js — release and support status. https://nodejs.org/en/about/previous-releases

[2] Docker — port publishing and mapping. https://docs.docker.com/engine/network/port-publishing/

[3] AWS — EC2 instance IP addressing. https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-instance-addressing.html

[4] MongoDB Atlas — configure IP access list entries. https://www.mongodb.com/docs/atlas/security/ip-access-list/

[5] BullMQ — going to production. https://docs.bullmq.io/guide/going-to-production

[6] BullMQ — idempotent jobs. https://docs.bullmq.io/patterns/idempotent-jobs

[7] BullMQ — retrying failing jobs. https://docs.bullmq.io/guide/retrying-failing-jobs

[8] Docker — container restart policies. https://docs.docker.com/engine/containers/start-containers-automatically/

[9] MongoDB Atlas — restore from continuous cloud backup. https://www.mongodb.com/docs/atlas/backup/cloud-backup/restore-from-continuous/

[10] AWS — S3 versioning. https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html

[11] AWS — ECS deployment circuit breaker. https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html
