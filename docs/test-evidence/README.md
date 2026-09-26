# Test-plan execution evidence

Evidence for `docs/MotorX_Test_Plan_Report` version 2.0 (26 September 2026). Baseline and environment: see `run-metadata.json`.
The report, `docs/MotorX_Test_Case_Register.csv` and `automated-test-register.csv` are generated from these files by `python docs/build_test_plan.py`.

| Artifact | Scope | Observed result |
| --- | --- | --- |
| `backend-results.json` | All 26 backend suites: unit, MongoDB/Redis integration and HTTP journeys (isolated Docker test stack) | 147 passed, 0 failed |
| `worker-results.json` | All 14 worker suites, including the MongoDB job-safety suite and the 5,000-row benchmark (`RUN_BENCHMARKS=1`) | 94 passed, 0 failed |
| `frontend-results.json` | All 13 frontend component suites (jsdom) | 50 passed, 0 failed |
| `automated-test-register.csv` | Every automated test above, with its case group, level, status and duration | 291 tests |
| `benchmark-output.txt` | Two consecutive runs of the 5,000-row import benchmark | 11.1 s and 11.2 s (target 120 s) |
| `live-smoke-output.txt`, `live-smoke-results.json` | Read-only smoke test of the running development stack with real data (`scripts/smoke/live-stack-smoke.py`) | 16 passed, 1 failed (22 of 23 active listing photos only existed on an old server, finding F-01) |
| `build-output.txt` | `npm run build --workspaces --if-present` | Exit code 0 |
| `run-metadata.json` | Revision, runtimes, commands and limitations | Informational |

Commands (repository root):

```powershell
docker compose -f compose.yml -f compose.test.yml run --rm backend
docker compose -f compose.yml -f compose.test.yml run --rm -e RUN_BENCHMARKS=1 worker
cd apps/frontend; npx vitest run
npm run build --workspaces --if-present
python scripts/smoke/live-stack-smoke.py
```

JSON files were produced by adding `--reporter=json --outputFile=<path>` to the Vitest commands. The worker crash drill (`scripts/drills/kill-worker-mid-import.sh`) result is recorded in `docs/RESILIENCE.md`.

Not covered by this evidence: browser end-to-end journeys (report Section 3.4, to be executed manually by the team), real Firebase/SMTP integration, load testing, and code coverage (no coverage tool installed). HTTP journey tests replace the Firebase Admin SDK and the S3 client; they are not evidence about those external services.
