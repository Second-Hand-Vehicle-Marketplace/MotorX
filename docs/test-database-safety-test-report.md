# Test Database Safety Test Report

## 1. Report Metadata

| Field | Value |
|---|---|
| Project | MotorX |
| Test area | Destructive database-test safety |
| Report date | 2026-09-21 |
| Report timezone | `+05:30` |
| Report generated | `2026-09-21 18:41:27 +05:30` |
| Operating system | Windows |
| Shell | PowerShell |
| Repository | `D:\MotorX\MotorX` |
| Node test runner | Vitest 4.1.10 |
| MongoDB test policy | Explicit `TEST_MONGODB_URI` only |
| Application URI fallback | Prohibited |

## 2. Test Objective

Verify that destructive backend tests cannot accidentally use the normal application database or a production MongoDB Atlas database.

The test helper clears registered MongoDB collections with `deleteMany({})`. Therefore, the helper must refuse unsafe configuration before any MongoDB connection or collection mutation is attempted.

## 3. Scope

This report covers:

- explicit test URI enforcement;
- refusal to use `MONGODB_URI` as a fallback;
- MongoDB URI scheme validation;
- disposable database-name validation;
- local and Docker host validation;
- remote Atlas host opt-in behavior;
- test Compose syntax and replica-set configuration;
- backend compilation;
- full backend test-suite behavior when no disposable MongoDB URI is configured.

This report does not claim that the full database-backed repository suite passed locally, because no disposable MongoDB test URI was configured during the final run.

## 4. Implementation Under Test

### 4.1 Test helper

File:

`apps/backend/src/test/db.ts`

The helper now requires:

```text
TEST_MONGODB_URI
```

It does not read `MONGODB_URI` as a fallback.

The helper validates:

1. The URI exists.
2. The URI uses `mongodb://` or `mongodb+srv://`.
3. The database name matches:
   - `motorx_test`
   - `motorx_test_<suffix>`
   - `motorx_test-<suffix>`
4. The hostname is local or Docker-managed by default:
   - `127.0.0.1`
   - `localhost`
   - `mongodb`
5. Remote hosts require:

```text
ALLOW_REMOTE_TEST_DB=true
```

Remote opt-in is intended only for a dedicated disposable Atlas test database.

### 4.2 Safety tests

File:

`apps/backend/src/test/db.safety.test.ts`

The suite contains eight tests:

| Test | Expected behavior |
|---|---|
| Local disposable URI | Accepted |
| Docker MongoDB host | Accepted |
| Non-test database name | Rejected |
| Remote Atlas hostname by default | Rejected |
| Remote Atlas hostname with explicit opt-in | Accepted |
| Unsupported URI scheme | Rejected |
| Missing `TEST_MONGODB_URI` with `MONGODB_URI` present | Rejected; no fallback |
| Valid configured test URI | Accepted and returned unchanged |

### 4.3 CI configuration

File:

`.github/workflows/ci.yml`

CI now configures MongoDB with replica-set support:

```text
--replSet rs0
```

CI initializes the replica set with `mongosh` and uses:

```text
mongodb://127.0.0.1:27017/motorx_test?replicaSet=rs0
```

### 4.4 Test Compose configuration

File:

`compose.test.yml`

The test override contains:

- MongoDB 7;
- `--replSet rs0`;
- a MongoDB healthcheck;
- a replica-set initialization service;
- `service_healthy` dependency gating;
- temporary `tmpfs` database storage;
- `TEST_MONGODB_URI` for backend and worker services;
- transaction-compatible connection strings.

## 5. Environment and Safety Conditions

The final local full backend test command was intentionally run without `TEST_MONGODB_URI`.

This was a safety check. The expected result was refusal before database connection.

No production MongoDB URI was used by the test helper.

No application data was intentionally mutated during this report run.

## 6. Timestamped Execution Log

All times are local time with offset `+05:30`.

### 6.1 Dedicated URI safety suite

Command:

```powershell
Push-Location apps/backend
npx.cmd vitest run src/test/db.safety.test.ts --config vitest.config.ts
Pop-Location
```

| Event | Timestamp |
|---|---|
| Start | `2026-09-21 18:34:16 +05:30` |
| Vitest start | `18:34:19` |
| End | `2026-09-21 18:34:20 +05:30` |
| Duration | `4.06s` |
| Exit code | `0` |
| Test files | `1 passed` |
| Tests | `8 passed` |

Result: **PASS**

### 6.2 Compose configuration validation

Command:

```powershell
docker compose --env-file .env.example -f compose.yml -f compose.test.yml config --quiet
```

| Event | Timestamp |
|---|---|
| Start | `2026-09-21 18:37:23 +05:30` |
| End | `2026-09-21 18:37:24 +05:30` |
| Duration | `0.30s` |
| Exit code | `0` |
| Output | No output, valid configuration |

Result: **PASS**

### 6.3 Backend build

Command:

```powershell
npm.cmd run build --workspace @motorx/backend
```

| Event | Timestamp |
|---|---|
| Start | `2026-09-21 18:37:30 +05:30` |
| End | `2026-09-21 18:37:36 +05:30` |
| Duration | `6.39s` |
| Exit code | `0` |
| Compiler | TypeScript `tsc -p tsconfig.json` |

Result: **PASS**

### 6.4 Full backend test suite without test URI

Command:

```powershell
npm.cmd test --workspace @motorx/backend -- --maxWorkers=1
```

| Event | Timestamp |
|---|---|
| Start | `2026-09-21 18:40:51 +05:30` |
| End | `2026-09-21 18:40:57 +05:30` |
| Duration | `5.34s` |
| Exit code | `1` |
| Test files passed | `8` |
| Test files failed | `3` |
| Tests passed | `42` |
| Tests skipped | `6` |
| Failure cause | Missing `TEST_MONGODB_URI` |

Expected safety error:

```text
TEST_MONGODB_URI is required for database tests. Refusing to use MONGODB_URI.
```

Result: **EXPECTED SAFE FAILURE**

This is not an application-test regression. The three database repository suites were prevented from connecting because no disposable test database was configured.

## 7. Results Summary

| Check | Result | Evidence |
|---|---|---|
| Test URI is mandatory | Pass | Safety suite test 7 |
| `MONGODB_URI` fallback is blocked | Pass | Safety suite test 7 |
| Local disposable URI accepted | Pass | Safety suite test 1 |
| Docker MongoDB host accepted | Pass | Safety suite test 2 |
| Production-style database name rejected | Pass | Safety suite test 3 |
| Remote Atlas host blocked by default | Pass | Safety suite test 4 |
| Remote Atlas opt-in works | Pass | Safety suite test 5 |
| Unsupported URI scheme rejected | Pass | Safety suite test 6 |
| Compose configuration valid | Pass | Exit code 0 |
| Backend compiles | Pass | Exit code 0 |
| Full DB-backed repository suite | Not executed | Requires disposable MongoDB URI |

## 8. Atlas-Specific Test Configuration

For a dedicated Atlas test cluster, configure:

```env
TEST_MONGODB_URI=mongodb+srv://test_user:<password>@test-cluster.mongodb.net/motorx_test?retryWrites=true&w=majority
ALLOW_REMOTE_TEST_DB=true
```

Required Atlas controls:

- separate test cluster or disposable test database;
- separate test database user;
- least-privilege access;
- Network Access allowlist containing only the test runner IP;
- no production database name;
- no production credentials;
- no shared production data.

Run the database-backed tests sequentially:

```powershell
$env:TEST_MONGODB_URI="mongodb+srv://test_user:<password>@test-cluster.mongodb.net/motorx_test?retryWrites=true&w=majority"
$env:ALLOW_REMOTE_TEST_DB="true"
npm.cmd test --workspace @motorx/backend -- --maxWorkers=1
```

Do not place a real password in committed files, documentation, shell history, or pull requests.

## 9. Remaining Environment-Level Evidence

The implementation checks are complete, but the following evidence still requires a running disposable MongoDB service:

1. Backend repository tests connect successfully.
2. Collection cleanup executes only inside the disposable database.
3. Transaction tests succeed against the configured replica set.
4. The Compose MongoDB initialization service completes successfully.
5. The CI workflow completes with the replica-set service.

Recommended local command:

```powershell
docker compose -f compose.yml -f compose.test.yml up --build --abort-on-container-exit
```

Recommended cleanup command after the run:

```powershell
docker compose -f compose.yml -f compose.test.yml down --volumes
```

The `--volumes` option is appropriate for this test stack because the test database uses disposable infrastructure.

## 10. Final Assessment

The original destructive-test vulnerability is addressed at the code level:

- tests require an explicit test-only environment variable;
- the normal application URI cannot be used as a fallback;
- unsafe database names are rejected;
- remote Atlas hosts are blocked unless explicitly enabled;
- test URI behavior is covered by eight automated safety tests;
- CI and Compose are configured for transaction-capable MongoDB testing.

The only uncompleted item in this report is environment-level execution of the full database-backed suite. That requires a running disposable MongoDB instance or a dedicated Atlas test cluster.
