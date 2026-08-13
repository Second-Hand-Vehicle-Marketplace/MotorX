# MotorX

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

## Prerequisites

For complete clone, Atlas access, and first-run instructions, see [MotorX Developer Setup](docs/DEVELOPER_SETUP.md).

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

- Frontend: <http://localhost:8080>
- Backend API: <http://localhost:3000>
- Backend liveness: <http://localhost:3000/health/live>
- Backend readiness: <http://localhost:3000/health/ready>
- MinIO console: <http://localhost:9001>

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

If the backend reports an Atlas connection, TLS, or `ReplicaSetNoPrimary` error, verify:

1. `MONGODB_URI` in the root `.env` is the exact Atlas connection string.
2. The Atlas database username and password are correct.
3. Special characters in the password are URL-encoded.
4. Your current public IP is allowed by Atlas Network Access.
5. Docker Desktop has internet and DNS access.

## Local Service Addresses

| Service | Address |
|---|---|
| Frontend | `http://localhost:8080` |
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
