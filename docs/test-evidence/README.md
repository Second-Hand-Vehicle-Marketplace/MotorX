# Test-plan execution evidence

Baseline and environment: see `run-metadata.json`. This evidence was generated while preparing the MotorX test-plan report on 21 September 2026.

| Artifact | Scope | Observed result |
| --- | --- | --- |
| `backend-unit-results.json` | Eight backend suites excluding database repository tests | 42 passed, 0 failed |
| `worker-results.json` | Six pipeline and mocked-service suites | 35 passed, 0 failed |
| `automated-test-register.csv` | Individual outcomes exported from both JSON reports | 77 assertions/test cases |
| `build-output.txt` | All four workspace builds | Exit code 0 |
| `run-metadata.json` | Revision, runtime, environment and execution limitations | Informational |

Commands were run from the repository root:

```powershell
npm.cmd test --workspace @motorx/backend -- --exclude "**/*.repository.test.ts" --reporter=json --outputFile=../../docs/test-evidence/backend-unit-results.json
npm.cmd test --workspace @motorx/worker -- --reporter=json --outputFile=../../docs/test-evidence/worker-results.json
npm.cmd run build --workspaces --if-present
```

Database repository tests were not run: this execution environment could not access the Docker daemon, and this task did not provision a disposable database. Browser, load, performance and recovery tests were not run. Worker service tests mock durable dependencies; they are not proof of real database/queue/storage integration. Frontend and shared-contracts placeholder test scripts do not count as tests.

The report has 48 case groups/scenarios. Its 14 executed unit/component groups summarize the same 77 individual tests; these are not additional tests to add to the total. The three existing database repository files contain six further test cases, with no execution outcome asserted here.

The Word document was checked structurally using python-docx and its case register was checked against the JSON reports. Visual Word/PDF rendering was unavailable because Word automation could not start in this logon session. Review page layout in Word before printing; no PDF rendering is represented as completed.
