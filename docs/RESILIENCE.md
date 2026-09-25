# MotorX Resilience and Recovery

How MotorX keeps uploads correct when parts of the system fail, what the production infrastructure must provide, and how to prove recovery works before launch. Deployment steps are in [CD_GUIDE.md](CD_GUIDE.md).

## How inventory jobs survive failures

The MongoDB `uploadJobs` document is the source of truth. The Redis/BullMQ message only tells a worker to start.

| Failure | What happens |
|---|---|
| Redis is down (or hangs) when a dealer uploads | The CSV or zip is stored and the job is saved as `pending`, and the dealer gets a normal response within 3 s. The worker's reconciler re-queues any job still pending after `PENDING_JOB_REENQUEUE_AFTER_MS` (2 min). |
| Backend crashes between saving the job and queuing it | Same as above: the pending job is re-queued by the reconciler. |
| Worker crashes or is killed mid-job | The job's lease (2 min, renewed every 40 s while work continues) expires, and the reconciler re-queues it. The next attempt **resumes**: CSV imports continue after the last checkpointed batch, and each CSV row can create at most one listing (unique `sourceUploadJobId` + `sourceRowNumber`). Rejected rows are insert-once. Photos use deterministic storage keys (upload + listing + zip path + content hash), so a retry overwrites its own objects and skips photos already attached. |
| A slow worker's lease expires and another worker takes over | Every write (progress, completion, failure) requires the current lease-owner token. The old worker's writes are refused and it stops without changing anything. |
| Temporary storage, network, or database error | The job goes back to `pending` and BullMQ retries it after about 5 s, 10 s, and 20 s (exponential backoff with jitter). Permanent errors (unreadable CSV, invalid zip, missing file) fail immediately. |
| Retries exhausted | After `JOB_MAX_RECLAIM_ATTEMPTS` (5) claims, the job is marked `failed` and the dealer is notified. The dealer can press **Retry** on the upload page (`POST /api/v1/dealer/uploads/:id/retry` or `/images/retry`), which starts a fresh attempt budget and resumes safely. |
| Deployment or scale-in stops a worker | The worker stops taking jobs and waits up to `SHUTDOWN_TIMEOUT_MS` (25 s) for running jobs. Anything still running is handed back as `pending`, so another worker resumes it at once. |
| Deployment stops a backend task | It stops accepting connections, lets in-flight requests finish for up to `SHUTDOWN_TIMEOUT_MS` (20 s), then closes MongoDB and Redis and exits before ECS's 30 s stop timeout. |

## Infrastructure requirements

### Compute (ECS)

- **Backend: at least 2 tasks in 2 Availability Zones** behind the load balancer, so one host or zone failure does not take the site down.
- **Worker: 2 tasks.** Concurrent processing is safe because of the lease-owner tokens.
- Container health check: `/health/live`. Load balancer target health: `/health/ready` (backend).
- Stop timeout: 30 s. Deployment circuit breaker with rollback enabled (already in CD_GUIDE).
- Images are immutable (tagged by commit SHA) and ECR tag immutability is on.

### Redis (ElastiCache) for BullMQ

- Private subnets only, reachable only from the backend and worker security groups.
- **In-transit encryption (TLS, `rediss://`) and AUTH token**, encryption at rest.
- **Multi-AZ with automatic failover** (one replica).
- Parameter group with **`maxmemory-policy noeviction`**. Queue records are data, not cache: an evicted job message would silently disappear. (BullMQ logs a warning at startup if this is wrong.) Local `compose.yml` uses the same setting.
- Daily snapshots with at least 3 days' retention. Redis is not the source of truth (MongoDB is), so the reconciler rebuilds the queue even if Redis is lost entirely.
- Alarm on memory use above 80%: with `noeviction`, a full Redis refuses new jobs.

### MongoDB Atlas

- **Continuous backups with point-in-time recovery** (M10+ dedicated cluster). On shared tiers, schedule regular `mongodump` exports to a separate, versioned S3 bucket.
- Separate production project and least-privilege database user (see CD_GUIDE §4).
- After deploying this change, confirm the new unique index `sourceUploadJobId_sourceRowNumber` on `listings` was built (created automatically at startup).

### S3

- **Versioning enabled**, with a lifecycle rule that expires non-current versions after 30 days. This protects against accidental deletes and overwrites without keeping deleted identity documents forever.
- Block Public Access on, default encryption (SSE-KMS), and access only through the ECS task role.

### Database changes and rollback

ECS rollback returns to the previous image, so every release must work with data written by the next one. Add fields as optional, never rename or remove a field in the same release that stops using it, and build indexes before code depends on them.

## Recovery targets

Proposed targets (confirm with the team, then measure them in the restore drill below):

| Target | Value | Achieved by |
|---|---|---|
| **RPO**: maximum data loss | 15 minutes | Atlas point-in-time recovery; S3 versioning; uploads are durable in MongoDB and S3 before the dealer gets a response |
| **RTO**: time to restore service | 1 hour | Multi-AZ ECS and Redis failover (minutes); Atlas restore into a new cluster plus a secret update and redeploy (under 1 hour) |

## Alarms (CloudWatch)

Alert on things users notice, not on every error:

| Alarm | Condition |
|---|---|
| API errors | Load balancer 5xx above 2% for 5 minutes |
| API latency | p95 target response time above 2 s for 10 minutes |
| Unhealthy backend | Healthy target count below 2 |
| Stuck uploads | Oldest `pending`/`processing` upload job older than 15 minutes |
| Failed uploads | More than 5 uploads or photo jobs `failed` in 1 hour |
| Worker heartbeat | No `workerHeartbeat` update for 5 minutes (written by the reaper every minute) |
| Queue backlog | BullMQ waiting jobs above 100 for 15 minutes |
| Memory | Task memory above 85% (backend, worker), Redis memory above 80% |
| Database | Atlas connections above 80% of the tier limit; Atlas alerts on replication lag and disk |
| Storage | S3 5xx errors, or `Enqueue deferred` / storage errors appearing repeatedly in logs |

Logs must never contain tokens, credentials, or document contents. The backend logger redacts authorization headers, cookies, passwords, and tokens. Do not log request bodies or file contents.

## Pre-launch recovery tests (staging)

Run each test in staging and record the result. Each one checks a specific item above.

| # | Test | Pass when |
|---|---|---|
| 1 | Kill a worker (`docker kill` / stop the ECS task) halfway through a large ZIP and a large CSV | The job resumes on another worker within about 3 minutes; the listing's photo count equals the zip's photos (no duplicates); the CSV creates each row's listing exactly once |
| 2 | Stop Redis, upload a CSV, then start Redis | The upload is accepted immediately as `pending` and completes within about 3 minutes of Redis returning |
| 3 | Block MongoDB (remove the Atlas access-list entry) | API requests fail within about 10 s with an error, not a hang; `/health/ready` returns 503 within 1 s; service recovers on its own when access returns |
| 4 | Deploy an image that exits at startup | The ECS circuit breaker rolls back to the previous task definition; the site stays up |
| 5 | Restore the Atlas backup to a new cluster and point staging at it | Listings load and their photos display (S3 objects referenced by restored listings exist) |
| 6 | Try another dealer's listing, upload, and document IDs | Every request returns 404/403 (see the ownership tests) |
| 7 | Upload several maximum-size zips (50 MB) at once | Backend and worker memory stay below their limits; no task is killed for running out of memory |
