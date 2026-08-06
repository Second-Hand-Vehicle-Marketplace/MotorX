# MotorX

MotorX is a second-hand vehicle marketplace with a React and TypeScript frontend, an Express modular-monolith backend, a separate ETL worker, MongoDB, Redis/BullMQ, MinIO object storage, and Firebase Authentication.

## Repository Layout

```text
MotorX/
├── apps/
│   ├── frontend/
│   ├── backend/
│   └── worker/
├── packages/
│   └── shared-contracts/
├── infrastructure/
│   ├── docker/
│   └── nginx/
├── docs/
├── compose.yml
├── compose.dev.yml
├── compose.watch.yml
├── compose.test.yml
├── .env.example
├── package.json
└── README.md
```

## Architecture

```text
React + TypeScript frontend
            │
            │ REST/JSON over HTTP(S)
            ▼
Node.js + Express modular monolith
      │          │           │
      ▼          ▼           ▼
 MongoDB      Redis       MinIO
                 │
                 ▼
          BullMQ ETL worker

Firebase Authentication provides identity. The backend verifies Firebase ID tokens and enforces MotorX roles, account status, and resource ownership.
```

## Run the Complete System

Run all commands from the repository root, where `compose.yml` is located.

### 1. Create the local environment file

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux or macOS:

```bash
cp .env.example .env
```

Add the required Firebase values to `.env`. Docker automatically uses the internal service addresses for MongoDB, Redis, and MinIO.

### 2. Validate the Compose configuration

```bash
docker compose config
```

### 3. Build and start MotorX

```bash
docker compose up --build
```

This starts:

- MongoDB;
- Redis;
- MinIO;
- the MinIO bucket initializer;
- the Express backend;
- the ETL worker;
- the React frontend.

### 4. Start with development bind mounts

```bash
docker compose -f compose.yml -f compose.dev.yml up --build
```

### 5. Start with Compose Watch

```bash
docker compose -f compose.yml -f compose.watch.yml up --build --watch
```

### 6. Run in the background

```bash
docker compose up --build -d
```

### 7. Stop the system

```bash
docker compose down
```

### 8. Reset local data

Warning: this deletes local MongoDB, Redis, and MinIO data.

```bash
docker compose down -v
```

### 9. View service status and logs

```bash
docker compose ps
```

```bash
docker compose logs -f
```

Backend logs:

```bash
docker compose logs -f backend
```

Worker logs:

```bash
docker compose logs -f worker
```

## Local Services

| Service | Address |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:3000` |
| Backend liveness | `http://localhost:3000/health/live` |
| Backend readiness | `http://localhost:3000/health/ready` |
| MongoDB | `mongodb://localhost:27017/motorx` |
| Redis | `redis://localhost:6379` |
| MinIO API | `http://localhost:9000` |
| MinIO Console | `http://localhost:9001` |

## Current Runnable Baseline

The repository currently provides:

- a minimal React screen;
- an Express server with liveness and readiness endpoints;
- a long-running worker scaffold;
- MongoDB, Redis, and MinIO containers;
- shared TypeScript contracts;
- Docker development and watch configurations.

Before implementing business components, complete the decisions and checks in [`BASE_SETUP_CHECKLIST.md`](BASE_SETUP_CHECKLIST.md).

The first business implementation milestone should be Firebase ID-token verification, local user bootstrap, role-based authorization, and protected-route tests.
