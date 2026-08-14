# MotorX

MotorX is a second-hand vehicle marketplace. Buyers can browse vehicles and contact dealers. Approved dealers can create listings and upload CSV inventory with a matching ZIP image bundle. Administrators can manage users, dealer applications, listings, upload jobs, and audit logs.

## Architecture

```text
React frontend (5173)
        |
        | HTTP/JSON and multipart file uploads
        v
Express backend API (3000)
        |
        +--> MongoDB Atlas: users, listings, upload jobs, inquiries, audit logs
        +--> Firebase Authentication: sign-in and identity tokens
        +--> Gmail SMTP: dealer and buyer email notifications
        +--> MinIO: CSV, ZIP, and vehicle image files
        +--> Redis + BullMQ: inventory job queue
                         |
                         v
                  ETL worker
```

Redis and MinIO are local Docker services in this repository. MongoDB Atlas, Firebase, and Gmail SMTP are external services configured through `.env`.

## Repository Layout

```text
apps/
  frontend/                  React + Vite user interface
  backend/                   Express API, MongoDB models, auth, uploads
  worker/                    BullMQ consumer and inventory ETL pipeline
packages/
  shared-contracts/          Shared TypeScript package
infrastructure/docker/       Dockerfiles for frontend, backend, and worker
docs/                        Architecture and project documentation
compose.yml                  Complete Docker stack
.env.example                 Safe configuration template
README.md                    This setup and operation guide
```

## Prerequisites

Install Docker Desktop with Docker Compose, Node.js 20 or newer, and Git.

## Configuration

Copy the safe template:

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

### Linux/macOS

```bash
cp .env.example .env
```

Never commit `.env`. It is ignored by Git. Only `.env.example` belongs in the repository.

## Getting External Credentials

### MongoDB Atlas

1. Open [MongoDB Atlas](https://www.mongodb.com/atlas), create an account, and create a free shared cluster.
2. In **Database Access**, create a database user and password.
3. In **Network Access**, allow the IP address where Docker connects. For temporary development only, `0.0.0.0/0` allows all IPs, but it is not recommended for production.
4. Select **Connect > Drivers**, copy the Node.js connection string, and put it in `MONGODB_URI`.

Example shape:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/motorx?retryWrites=true&w=majority
```

### Firebase Authentication

1. Open the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Open **Build > Authentication > Sign-in method** and enable **Email/Password**.
3. Add a web app under **Project settings > Your apps** and copy its values into `VITE_FIREBASE_*`.
4. Open **Project settings > Service accounts**, select **Generate new private key**, and copy the project ID, client email, and private key into `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.

Web values are used by the browser. Service-account values are private backend credentials used to verify Firebase ID tokens. Never expose the private key in frontend code or Git.

`OWNER_ADMIN_EMAIL` is the Firebase email that receives the MotorX `admin` role during backend login.

### Gmail SMTP

1. Use a Gmail or Google Workspace account.
2. Enable two-step verification.
3. Open Google Account **Security > App passwords**.
4. Create an app password for MotorX.
5. Put the email in `SMTP_USER` and generated app password in `SMTP_PASS`.

The app password is not the normal Gmail password. SMTP sends dealer-application, contact, and test-drive notifications.

### Redis and MinIO

No external account is required for the default Docker setup. Compose starts Redis and MinIO locally:

- Redis: `redis://redis:6379` inside Docker, `localhost:6379` from Windows.
- MinIO: `http://minio:9000` inside Docker, `http://localhost:9000` from the browser.

`S3_ACCESS_KEY`, `S3_SECRET_KEY`, and `S3_BUCKET` are local values chosen for this Docker environment. The `minio-init` service creates the bucket and enables browser downloads.

`HF_API_KEY` is optional. The current inventory validation and persistence flow does not require an external Hugging Face account.

## Start the Complete System

Run from the repository root:

```powershell
docker compose config
docker compose up -d --build --wait
```

Open:

- Frontend: <http://localhost:5173>
- Backend liveness: <http://localhost:3000/health/live>
- Backend readiness: <http://localhost:3000/health/ready>
- MinIO console: <http://localhost:9001>

Check services:

```powershell
docker compose ps
```

Expected services are `frontend`, `backend`, `worker`, `redis`, `minio`, and `mongodb`. Backend, Redis, and MongoDB should be healthy; worker should be `Up`.

## Development Commands

Build all workspaces:

```powershell
npm run build
```

Build one workspace:

```powershell
npm run build --workspace @motorx/backend
npm run build --workspace @motorx/worker
npm run build --workspace @motorx/frontend
```

Run local development processes outside Docker:

```powershell
npm run dev:backend
npm run dev:worker
```

Docker bind mounts:

```powershell
docker compose -f compose.yml -f compose.dev.yml up --build
```

Docker Watch:

```powershell
docker compose -f compose.yml -f compose.watch.yml up --build --watch
```

Stop containers:

```powershell
docker compose down
```

Reset local Docker volumes. This deletes local Redis, MinIO, and local Mongo container data; it does not delete Atlas data:

```powershell
docker compose down -v
```

## CSV + ZIP ETL Flow

1. A dealer selects one CSV and its matching ZIP.
2. The frontend sends both files to `POST /api/v1/uploads`.
3. The backend saves the source files in MinIO and creates an `uploadjobs` MongoDB document.
4. The backend adds an `inventory-upload` job to the BullMQ `inventory-processing` queue.
5. Redis stores the BullMQ job.
6. The worker receives the job and downloads both files from MinIO.
7. `extract.ts` parses CSV rows and reads ZIP images.
8. `validate.ts` checks required fields, including both `vin` and `plateNumber` identifiers.
9. `detectDuplicates.ts` rejects repeated VINs, plate numbers, or identical vehicle rows.
10. The worker matches `image1`, `image2`, and later image columns to ZIP filenames.
11. Images are stored under a job-specific path so duplicate filenames cannot overwrite another upload.
12. Valid rows become `listings` documents in MongoDB.
13. The worker updates `uploadjobs` and writes an `upload_completed` audit log.

Important implementation files:

- Queue connection: `apps/backend/src/config/redis.ts`
- Upload endpoint: `apps/backend/src/modules/inventory/upload.controller.ts`
- BullMQ consumer: `apps/worker/src/worker.ts`
- ETL job: `apps/worker/src/jobs/inventoryUpload.job.ts`
- ETL stages: `apps/worker/src/pipeline/`
- Worker Mongo models: `apps/worker/src/repositories/models.ts`
- MinIO helpers: `apps/backend/src/config/storage.ts` and `apps/worker/src/config/storage.ts`

Example CSV headers:

```csv
make,model,year,price,mileage,bodyType,fuelType,transmission,condition,vin,plateNumber,title,description,image1,image2
Toyota,Corolla,2020,18500,45000,sedan,petrol,automatic,used,JTDBR32E720123456,WP-CAB-1234,2020 Toyota Corolla,First owner,corolla_front.png,corolla_side.png
```

Each row must contain both `vin` and `plateNumber`. Both identifiers are used for duplicate protection.

## Verify Redis, BullMQ, and ETL

Check Redis:

```powershell
docker compose exec redis redis-cli ping
```

Expected:

```text
PONG
```

Check worker readiness:

```powershell
docker compose logs worker --tail=80
```

Expected:

```text
Worker connected to MongoDB.
MotorX ETL worker ready on queue inventory-processing.
```

After uploading a new CSV + ZIP, watch both services:

```powershell
docker compose logs -f backend
docker compose logs -f worker
```

Expected worker completion:

```text
ETL job <id> completed.
```

Inspect BullMQ keys:

```powershell
docker compose exec redis redis-cli KEYS "bull:inventory-processing:*"
```

BullMQ stores job metadata in Redis keys such as `completed`, `failed`, `events`, and individual job IDs. Old failed jobs may remain as history; check worker logs and MongoDB `uploadjobs` status for the latest upload.

## MongoDB Collections

| Collection | Purpose |
|---|---|
| `users` | Firebase-linked MotorX profiles and roles |
| `dealerapplications` | Dealer registration and approval status |
| `listings` | Vehicle data, identifiers, images, views, and leads |
| `uploadjobs` | CSV + ZIP batch status and rejected rows |
| `auditlogs` | Administrative and ETL activity |
| `inquiries` | Contact dealer and test-drive requests |

## Troubleshooting

### Worker does not start

```powershell
docker compose logs worker --tail=100
```

Confirm Atlas allows the Docker host IP and `MONGODB_URI` is correct.

### Images do not display

Confirm MinIO is running and `S3_PUBLIC_ENDPOINT=http://localhost:9000` is set. The backend uses `http://minio:9000` internally; the browser uses `http://localhost:9000`.

### Firebase login fails

Check Firebase web variables and backend Admin SDK variables. Make sure Email/Password sign-in is enabled.

### Email does not arrive

Check `SMTP_USER` and the Gmail app password. The application logs SMTP failures without stopping the main request.

### Upload is rejected

Open the upload report. It shows every rejected CSV row and reason. Each row must have `make`, `model`, `year`, `price`, `vin`, and `plateNumber`. Image names in the CSV must match files in the ZIP.


