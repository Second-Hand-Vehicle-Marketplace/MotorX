# MotorX Developer Setup

This guide explains MongoDB Atlas IP access and the exact steps a developer must follow to clone and run MotorX.

## Do I need to update the Atlas IP after every restart?

No. Restarting Windows, Docker Desktop, VS Code, or the MotorX containers does not by itself require an Atlas IP Access List change.

Update the Atlas entry only when the **public IP address of the internet connection used by Docker changes**. This can happen when:

- the internet service provider assigns a new dynamic public IP;
- the computer changes between home, office, campus, or mobile-hotspot networks;
- a VPN is enabled, disabled, or moved to another server;
- the router reconnects and receives a new public IP.

Display the current public IPv4 address in PowerShell:

```powershell
Invoke-RestMethod "https://api.ipify.org"
```

If the application already connects successfully, no Atlas change is needed. If Atlas rejects the connection and the displayed address is not in the project's IP Access List, add it as described below.

## Information each developer needs

Before starting, obtain the following from the project administrator through a secure channel:

- access to the GitHub repository;
- access to the MotorX MongoDB Atlas project, or a dedicated Atlas database username and password;
- the Atlas cluster connection string;
- the required Firebase Admin SDK values;
- the required Firebase Web SDK values;
- any other non-empty secret values required by the root `.env` file.

Do not send secrets in GitHub issues, commit them to Git, or paste them into this document. Each developer should preferably have a separate MongoDB database user so access can be revoked individually.

## First-time setup for another developer

### 1. Install prerequisites

Install:

- Git;
- Docker Desktop with Docker Compose;
- a current web browser.

Start Docker Desktop and wait until the Docker engine is running.

### 2. Clone the repository

Open PowerShell in the directory where the project should be stored, then run:

```powershell
git clone https://github.com/Second-Hand-Vehicle-Marketplace/MotorX.git
Set-Location MotorX
```

All remaining commands must be run from this directory, where `compose.yml` is located.

### 3. Create the root environment file

```powershell
Copy-Item .env.example .env
```

Open the new root `.env` file. Do not edit only `apps/backend/.env`, because Docker Compose reads the root `.env`.

### 4. Configure MongoDB Atlas access

Display the developer's current public IP:

```powershell
Invoke-RestMethod "https://api.ipify.org"
```

An Atlas project owner should then:

1. Sign in to MongoDB Atlas and open the MotorX project.
2. Open **Security > Network Access**.
3. Select **Add IP Address**.
4. Add the developer's current public IP address and a recognizable description.
5. Save the entry and wait until Atlas marks it active.

Add a single developer address instead of `0.0.0.0/0`. The latter permits connections from anywhere and should not be used for routine development.

Official reference: [MongoDB Atlas IP Access List documentation](https://www.mongodb.com/docs/atlas/security/add-ip-address-to-list/).

### 5. Configure the Atlas connection string

In the root `.env`, replace the example `MONGODB_URI` with the connection string from Atlas:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/motorx?retryWrites=true&w=majority
```

Replace every placeholder, including the angle brackets. The username must be a MongoDB **database user**, not merely an Atlas website account.

If the password contains reserved URI characters such as `@`, `:`, `/`, `?`, `#`, `%`, or `&`, URL-encode the password before placing it in the URI. The connection string must remain on one line.

Official reference: [Connect to Atlas using a driver](https://www.mongodb.com/docs/atlas/driver-connection/).

### 6. Configure Firebase

Fill in the values supplied by the project administrator:

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

Keep the remaining Redis, MinIO, API, upload, and pagination defaults unless the team has provided different values.

### 7. Validate the Compose configuration

```powershell
docker compose config --quiet
```

No output means that the configuration is valid. An error naming a missing variable means that value must be added to the root `.env`.

### 8. Build and start MotorX

For the first run:

```powershell
docker compose up -d --build
```

### 9. Check service health

```powershell
docker compose ps
```

If the backend is unhealthy or restarting, inspect its logs:

```powershell
docker compose logs --tail 200 backend
```

For Atlas errors, confirm the public IP, IP Access List entry, database username, password encoding, and connection string.

### 10. Open MotorX

- Frontend: <http://localhost:8080>
- Backend API: <http://localhost:3000>
- Backend liveness check: <http://localhost:3000/health/live>
- Backend readiness check: <http://localhost:3000/health/ready>
- MinIO console: <http://localhost:9001>

## Commands for later sessions

After starting Docker Desktop, start the existing MotorX containers without rebuilding:

```powershell
Set-Location <path-to-MotorX>
docker compose up -d
docker compose ps
```

You do not need `--build` after every computer or VS Code restart.

Rebuild after changing a Dockerfile, dependencies, or another image build input:

```powershell
docker compose up -d --build
```

After changing the root `.env`, recreate the backend and worker:

```powershell
docker compose up -d --force-recreate backend worker
```

Stop MotorX while preserving local volume data:

```powershell
docker compose down
```

## When a developer changes networks

1. Display the new public IP:

   ```powershell
   Invoke-RestMethod "https://api.ipify.org"
   ```

2. Compare it with the entries under Atlas **Security > Network Access**.
3. Add the new address if it is missing.
4. Remove obsolete personal IP entries when they are no longer required.
5. Restart the affected application containers if they do not reconnect automatically:

   ```powershell
   docker compose restart backend worker
   ```

Changing the Atlas IP Access List does not require rebuilding Docker images.
