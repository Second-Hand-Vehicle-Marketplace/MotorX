# MotorX

For the team's branch, pull-request and automated-check processes, see the [Continuous Integration Guide](docs/CI_GUIDE.md). For the live system, see [Production Deployment (EC2)](#production-deployment-ec2).

MotorX is a second-hand vehicle marketplace with a React and TypeScript frontend, an Express modular-monolith backend, a separate ETL worker, MongoDB Atlas, Redis/BullMQ, MinIO object storage, and Firebase Authentication.

## Architecture

```text
React + TypeScript frontend
            |
            | REST/JSON over HTTP(S)
            v
Node.js + Express modular monolith
      |              |             |
      v              v             v
MongoDB Atlas   Redis/BullMQ      MinIO
                       |
                       v
                 ETL worker
```

MongoDB Atlas is the primary persistent database required by the SRS. Docker Compose runs the application, Redis, MinIO, and supporting local services. Firebase Authentication provides identity; the backend verifies Firebase ID tokens and enforces MotorX roles, account status, and resource ownership.

## What's Implemented

- **Auth & roles** — Firebase-backed sign-in; buyer, dealer, and admin roles enforced end to end.
- **Dealers** — profile management, admin-reviewed onboarding, and listings across six vehicle categories (car, motorcycle, van, truck, three-wheeler, bus), each with its own required attributes and conditional fuel-type validation (e.g. engine capacity for combustion, battery capacity/range for electric).
- **Inventory** — bulk CSV upload with a downloadable, category-specific template and field guide per category; registration-number-based duplicate detection; a second bulk step to attach vehicle photos from a `.zip` (one folder per registration number), matched to the listings that upload created.
- **Marketplace** — buyer browsing with structured filters (category, make, model, year, price, fuel type, transmission, body type, condition), vehicle detail pages showing the real dealer's profile, and dealer-managed listing images.
- **Admin** — user, dealer, and listing moderation; upload monitoring; audit logs; system health; category-aware filtering.
- **Notifications** — in-app notification center for dealers and admins with unread counts, polling, read state, and email delivery status. Email notifications use responsive MotorX HTML with a plain-text fallback and vehicle details where relevant.
- **Search** — indexed structured filters, natural-language parsing, typo correction, bounded hybrid semantic/lexical ranking, and graceful lexical fallback. Semantic ranking uses a Hugging Face model (`HF_API_KEY`, `HF_EMBEDDING_MODEL`); see [Search embedding backfill](#search-embedding-backfill).

### Notification delivery matrix

| Event | Recipient | In-app | Email |
|---|---|---:|---:|
| CSV upload completed with no rejects | Dealer | Yes | No |
| Image-zip processing completed cleanly | Dealer | Yes | No |
| New dealer application submitted | Admins | Yes | No |
| Upload has a high rejection rate | Admins | Yes | No |
| Dealer application approved or rejected | Dealer | Yes | Yes |
| CSV upload failed or completed with errors | Dealer | Yes | Yes |
| Image-zip processing failed or completed with errors | Dealer | Yes | Yes |
| Listing removed or archived by admin | Dealer | Yes | Yes |
| Account suspended | User | No | Yes |

The notification bell is available in the dealer and admin portal headers. Removal notifications identify the exact vehicle using its vehicle name, registration number, listing ID, category, upload time, and removal time. Email delivery status is stored as `not_applicable`, `pending`, `sent`, or `failed`.

## Prerequisites

For complete clone, Atlas access, and first-run instructions, see [MotorX Developer Setup](DEVELOPER_SETUP.md).

Install and start Docker Desktop. You also need:

- a MongoDB Atlas cluster and database user;
- your current public IP in the Atlas **Network Access** allowlist;
- a Firebase project with Web SDK and Admin SDK credentials.

Get your current public IPv4 address in PowerShell:

```powershell
Invoke-RestMethod "https://api.ipify.org"
```

Add that address in MongoDB Atlas under **Security > Network Access**.

## Run the Complete System

Run every command below from the repository root—the directory containing `compose.yml`.

### 1. Create the root environment file

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux or macOS:

```bash
cp .env.example .env
```

Open the new root `.env` file and replace `MONGODB_URI` with the connection string supplied by MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/motorx?retryWrites=true&w=majority
```

Replace all placeholders, including the angle brackets. If the database password contains characters such as `@`, `:`, `/`, `?`, or `#`, URL-encode the password first.

Also fill in the required Firebase values in the same root `.env` file:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Configure SMTP for email notifications. For Gmail, use an app password rather than your normal account password:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-sender@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM="MotorX <your-sender@gmail.com>"
```

Never commit `.env` or paste live credentials into source files. The committed `.env.example` files contain placeholders only.

Docker Compose reads the root `.env`. The file at `apps/backend/.env` is only for running the backend directly outside Docker.

### 2. Validate the configuration

```powershell
docker compose config --quiet
```

No output means that the Compose configuration is valid.

### 3. Build and start for the first time

Start the complete system in the background:

```powershell
docker compose up -d --build
```

### 4. Confirm that the services are healthy

```powershell
docker compose ps
```

Watch the backend logs if it is not healthy:

```powershell
docker compose logs -f backend
```

Press `Ctrl+C` to stop following the logs. This does not stop the containers.

### 5. Open the application

- Frontend: <http://localhost:4173>
- Backend API: <http://localhost:3000>
- Backend liveness: <http://localhost:3000/health/live>
- Backend readiness: <http://localhost:3000/health/ready>
- MinIO console: <http://localhost:9001>

The Docker frontend is exposed on port `4173`. Port `5173` is used only when running the Vite frontend directly outside Docker. `CORS_ORIGIN` should match the URL used in your browser.

## Normal Daily Commands

After reopening Docker Desktop, VS Code, or the project, start the existing containers without rebuilding:

```powershell
docker compose up -d
```

Check their status:

```powershell
docker compose ps
```

Stop and remove the containers while preserving stored Docker volume data:

```powershell
docker compose down
```

Rebuild only after changing a Dockerfile, installed dependencies, or another image build input:

```powershell
docker compose up -d --build
```

Recreate the backend and worker after changing values in the root `.env`:

```powershell
docker compose up -d --force-recreate backend worker
```

## Development Modes

Start with development bind mounts:

```powershell
docker compose -f compose.yml -f compose.dev.yml up --build
```

Start with Compose Watch:

```powershell
docker compose -f compose.yml -f compose.watch.yml up --build --watch
```

If a running container doesn't pick up a source change even with a bind mount attached (a known `tsx watch` quirk on Windows/Docker Desktop), restart just that service:

```powershell
docker compose restart backend
```

## Running Tests

Each workspace (`shared-contracts`, `backend`, `worker`) has its own Vitest suite. Run everything from the repository root:

```powershell
npm test
```

Or target one workspace while iterating:

```powershell
npm test --workspace @motorx/backend
npm test --workspace @motorx/worker
```

## Production Deployment (EC2)

The live system (<https://motorx.duckdns.org>) runs on one EC2 instance with Docker Compose: a cost-conscious single-server deployment with container-level failover and disaster recovery.

| Part | How it runs |
| --- | --- |
| Caddy (`infrastructure/caddy/Caddyfile`) | The only public entry point (ports 80 and 443). Gets and renews a Let's Encrypt certificate, redirects HTTP to HTTPS, compresses responses and load-balances the API |
| Backend | 2 copies behind Caddy (least-busy routing; a failed request is retried on the other copy) |
| Worker | 2 copies, one job each; job leases stop both taking the same upload |
| Frontend | Production build served by nginx |
| Redis, MinIO | Containers on the instance, reachable only inside it |
| Database | MongoDB Atlas |

### First-time setup

1. Point a domain (e.g. a free DuckDNS name) at the instance's Elastic IP. In the security group allow 80 and 443 from anywhere and 22 from your own IP only.
2. Create `.env` from `.env.example` and set `SITE_DOMAIN`, `VITE_API_BASE_URL=https://<SITE_DOMAIN>/api/v1` and `RELEASE_TAG` (the commit SHA). `compose.lb.yml` sets `TRUST_PROXY_HOPS`, `CORS_ORIGIN` and `S3_PUBLIC_URL` from `SITE_DOMAIN`.
3. Build one image at a time (the instance is small), then start everything:

```bash
C="docker compose --env-file .env -f compose.yml -f compose.ec2.yml -f compose.lb.yml"
$C build backend && $C build worker && $C build frontend
$C up -d --no-build
$C ps
```

### Releasing and rolling back

Every release is a set of images tagged with its commit SHA, so the previous release stays available for rollback:

```bash
git pull
sed -i "s/^RELEASE_TAG=.*/RELEASE_TAG=$(git rev-parse HEAD)/" .env
$C build backend && $C build worker && $C build frontend
$C up -d --no-build --force-recreate backend worker frontend
```

To roll back, set `RELEASE_TAG` to the previous SHA, restore that release's `.env`, and run the last command again. Code is never edited on the server: fix it locally, push, then pull.

### Checking the deployment

```bash
D=$(grep '^SITE_DOMAIN=' .env | cut -d= -f2)
curl -s "https://$D/health/ready"
for i in $(seq 1 10); do curl -s -o /dev/null -D - "https://$D/health/ready" | grep -i x-served-by; done | sort | uniq -c
python3 scripts/smoke/live-stack-smoke.py "https://$D" "https://$D"
```

The second command should show both backend copies answering. The smoke test sends read-only requests.

### Backups

`scripts/backup/backup-to-s3.sh` takes a nightly backup set from cron: it pauses the backend and workers for 2–3 minutes, dumps MongoDB and archives the MinIO files, then uploads both to a private S3 bucket with a `COMPLETE` marker and pings healthchecks.io. The usage and cron line are at the top of the script. A set is only trusted once a restore of it has been tested.

### Load testing

`scripts/load/marketplace-load.js` is a k6 test (5, 20 and 50 users browsing and searching) with pass thresholds per request type. Run it from a laptop, never from the server, and raise `RATE_LIMIT_API_PER_MINUTE` and `RATE_LIMIT_SEARCH_PER_MINUTE` for the run, because all requests come from one address.

## Maintenance Scripts

`apps/backend/scripts/migrate-vehicle-categories.mjs` backfills pre-existing listings and upload jobs that predate the multi-category vehicle model (adds a synthetic registration number, defaults `category` to `car`, and moves the old flat fuel/transmission/mileage fields into `attributes`). It's idempotent — safe to re-run, and only touches documents missing a `category`. Always dry-run it first against the target database:

```powershell
$env:MONGODB_URI = "<connection string>"
node apps/backend/scripts/migrate-vehicle-categories.mjs --dry-run
```

Drop `--dry-run` to apply the changes once the output looks right.

### Search embedding backfill

After configuring MongoDB and the embedding provider, backfill embeddings for all eligible listings:

```powershell
npm.cmd run search:backfill --workspace @motorx/backend -- --all
```

To process only listings that do not already have embeddings, run:

```powershell
npm.cmd run search:backfill --workspace @motorx/backend
```

## Logs and Troubleshooting

Follow logs for all services:

```powershell
docker compose logs -f
```

Follow backend or worker logs:

```powershell
docker compose logs -f backend
docker compose logs -f worker
```

To verify notification delivery manually:

1. Sign in as an admin and a dealer in separate browser sessions.
2. Submit or review a dealer application, or create an upload job.
3. Open the bell in the relevant portal header and confirm the notification appears.
4. For events marked “Email: Yes”, check the recipient inbox and confirm the stored email status shown in the notification center.

Gmail may place messages from a new Gmail SMTP sender in Spam. For production delivery, use a verified sending domain with SPF, DKIM, and DMARC records; application code cannot guarantee inbox placement.

If the backend reports an Atlas connection, TLS, or `ReplicaSetNoPrimary` error, verify:

1. `MONGODB_URI` in the root `.env` is the exact Atlas connection string.
2. The Atlas database username and password are correct.
3. Special characters in the password are URL-encoded.
4. Your current public IP is allowed by Atlas Network Access.
5. Docker Desktop has internet and DNS access.

## Local Service Addresses

| Service | Address |
|---|---|
| Frontend | `http://localhost:4173` |
| Backend API | `http://localhost:3000` |
| Backend liveness | `http://localhost:3000/health/live` |
| Backend readiness | `http://localhost:3000/health/ready` |
| Redis | `redis://localhost:6379` |
| MinIO API | `http://localhost:9000` |
| MinIO console | `http://localhost:9001` |

MongoDB Atlas is remote and therefore has no localhost application address.

## Reset Local Docker Data

Warning: the following command permanently deletes local Docker volume data for services such as Redis and MinIO. It does not delete MongoDB Atlas data.

```powershell
docker compose down -v
```
