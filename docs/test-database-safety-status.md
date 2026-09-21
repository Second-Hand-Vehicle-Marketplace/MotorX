# Test Database Safety Status

## Summary

The main test-database safety vulnerability has been fixed. Tests no longer fall back to `MONGODB_URI`, so an incorrectly configured local test run cannot accidentally connect to the development or production database through the existing helper.

The implementation is complete for the current safety scope. The URI safety tests pass, CI is configured for a MongoDB replica set, and remote Atlas test connections require explicit opt-in.

## Completed

### Explicit test URI

The backend test helper now requires:

```text
TEST_MONGODB_URI
```

It refuses to use `MONGODB_URI`:

```text
TEST_MONGODB_URI is required for database tests. Refusing to use MONGODB_URI.
```

### Disposable database-name validation

The helper only accepts database names matching:

```text
motorx_test
motorx_test_<suffix>
motorx_test-<suffix>
```

Production-style database names are rejected before database cleanup occurs.

### CI configuration

GitHub Actions now provides:

```text
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/motorx_test
```

### Test Compose configuration

`compose.test.yml` now includes:

- a temporary MongoDB 7 service;
- a MongoDB replica-set command;
- a replica-set initialization service;
- isolated `tmpfs` database storage;
- `TEST_MONGODB_URI` for backend and worker tests;
- transaction-compatible MongoDB connection strings.
- health-gated MongoDB startup before replica-set initialization.

### Automated safety tests

`apps/backend/src/test/db.safety.test.ts` verifies:

- local disposable URI acceptance;
- Docker MongoDB host acceptance;
- unsafe database-name rejection;
- remote Atlas host rejection by default;
- explicit remote test-database opt-in;
- unsupported URI-scheme rejection.

Run them with:

```powershell
Push-Location apps/backend
npx.cmd vitest run src/test/db.safety.test.ts --config vitest.config.ts
Pop-Location
```

## Current protection behavior

Running backend database tests without a test URI fails safely:

```text
TEST_MONGODB_URI is required for database tests. Refusing to use MONGODB_URI.
```

Using a non-test database name fails safely:

```text
Refusing to run destructive tests against database "production".
```

The destructive cleanup still uses `deleteMany({})`, but only after the explicit safety checks and connection setup.

## Remaining work

### CI replica-set setup

The GitHub Actions MongoDB service now starts with `--replSet rs0`, initializes with `mongosh`, and uses:

```text
mongodb://127.0.0.1:27017/motorx_test?replicaSet=rs0
```

Example initialization command:

```bash
mongosh --host 127.0.0.1:27017 --eval \
  "rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27017'}]})"
```

### Compose readiness

The test initialization service now waits for MongoDB to become healthy, not only for the container to start.

Use a MongoDB healthcheck and change the dependency condition to:

```yaml
condition: service_healthy
```

### Host validation

Database-name validation is combined with host validation. Local hosts and the Docker host are allowed by default. A remote Atlas URI requires:

```text
ALLOW_REMOTE_TEST_DB=true
```

This must only be used with a dedicated disposable Atlas test database and restricted test credentials.

### Test-run isolation

All local database tests currently use the same `motorx_test` database. Keep database tests sequential with:

```powershell
npm.cmd test --workspace @motorx/backend -- --maxWorkers=1
```

For stronger isolation, generate a per-run database name such as:

```text
motorx_test_<process-id>
```

### Run the acceptance checks with disposable infrastructure

PowerShell local check:

```powershell
$env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017/motorx_test"
npm.cmd test --workspace @motorx/backend -- --maxWorkers=1
```

Safety failure check:

```powershell
Remove-Item Env:TEST_MONGODB_URI -ErrorAction SilentlyContinue
npm.cmd test --workspace @motorx/backend -- --maxWorkers=1
```

Compose validation:

```powershell
docker compose --env-file .env.example -f compose.yml -f compose.test.yml config --quiet
```

Run the isolated test stack:

```powershell
docker compose -f compose.yml -f compose.test.yml up --build --abort-on-container-exit
```

## Status by acceptance criterion

| Criterion | Status |
|---|---|
| Non-test target refused before mutation | Complete |
| Tests require `TEST_MONGODB_URI` | Complete |
| `MONGODB_URI` cannot be used by test helper | Complete |
| CI uses disposable test database variable | Complete |
| Test Compose defines MongoDB | Complete |
| Test Compose supports transactions | Implemented; requires running the stack for environment-level evidence |
| Automated safety tests | Complete; 6 tests pass |
| Strong host allowlist | Complete; remote hosts require explicit opt-in |
| Per-run database isolation | Not yet added |
| Full backend database suite | Requires disposable MongoDB infrastructure |

## Recommended completion order

1. Run the Compose test stack and record the backend repository/transaction test results.
2. Run CI and retain the successful workflow as acceptance evidence.
3. Use a dedicated Atlas test cluster only when remote testing is required, with `ALLOW_REMOTE_TEST_DB=true`.
