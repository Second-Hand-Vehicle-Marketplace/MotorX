# MotorX Continuous Integration Guide

MotorX uses GitHub Actions to check changes before they are merged. The workflow is defined in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## When CI runs

CI starts automatically when:

- a pull request targets `dewni` or `main`;
- a commit is pushed directly to `dewni` or `main`;
- a team member manually selects **Actions > CI > Run workflow**.

If a newer commit is pushed to the same branch while CI is running, GitHub cancels the older run.

## What CI does

### 1. Creates an isolated runner

GitHub starts a temporary Ubuntu machine. It does not use a developer's computer, local `.env`, Atlas database, or Firebase credentials.

### 2. Starts MongoDB for tests

The runner starts a temporary MongoDB 7 service on port `27017`. Tests use:

```text
mongodb://127.0.0.1:27017/motorx_test
```

This prevents CI from modifying development or production Atlas data.

### 3. Installs exact dependencies

```bash
npm ci
```

`npm ci` installs versions recorded in `package-lock.json`. CI fails if the lockfile and package manifests are inconsistent.

CI then runs:

```bash
npm audit --audit-level=high
```

High- or critical-severity dependency findings fail CI. Lower-severity findings remain visible in the job log and should still be reviewed and scheduled for remediation.

### 4. Validates Docker Compose

```bash
docker compose --env-file .env.example config --quiet
```

This catches invalid YAML, missing required variables, and Compose configuration errors.

### 5. Compiles every workspace

CI builds in dependency order:

```text
shared contracts
      |
backend, worker, frontend
```

The commands are:

```bash
npm run build --workspace @motorx/shared-contracts
npm run build --workspace @motorx/backend
npm run build --workspace @motorx/worker
npm run build --workspace @motorx/frontend
```

TypeScript errors or frontend production-build errors fail the workflow.

### 6. Runs automated tests

```bash
npm test --workspace @motorx/backend -- --maxWorkers=1
npm test --workspace @motorx/worker -- --maxWorkers=1
```

The suites run sequentially to avoid unnecessary memory use and database interference.

### 7. Builds Docker images

Only after compilation and tests pass, GitHub builds the backend, worker, and frontend images. The images are tagged with the Git commit SHA for traceability.

CI verifies that images can be built, but it does not publish or deploy them. Publishing and AWS deployment belong in the separate CD workflow.

## Team development process

### 1. Update the integration branch

```powershell
git switch dewni
git pull origin dewni
```

### 2. Create a feature branch

```powershell
git switch -c feature/short-description
```

Examples:

```text
feature/csv-upload
feature/natural-language-search
fix/listing-validation
```

### 3. Make and test the change locally

Run the same main checks used by CI:

```powershell
npm.cmd ci
npm.cmd run build --workspace @motorx/shared-contracts
npm.cmd run build --workspace @motorx/backend
npm.cmd run build --workspace @motorx/worker
npm.cmd run build --workspace @motorx/frontend
npm.cmd test --workspace @motorx/backend -- --maxWorkers=1
npm.cmd test --workspace @motorx/worker -- --maxWorkers=1
```

The database-dependent tests require a local test MongoDB. It can be started with Docker:

```powershell
docker compose up -d mongodb
```

### 4. Commit and push

```powershell
git add .
git commit -m "Describe the completed change"
git push -u origin feature/short-description
```

### 5. Open a pull request

Open GitHub and create a pull request:

```text
feature branch -> dewni
```

GitHub starts CI automatically. Open the pull request's **Checks** section to view each command and its output.

### 6. Fix failures

If CI fails:

1. Open the failed job and failed step.
2. Reproduce its command locally.
3. Fix the code or configuration.
4. Commit and push the correction.

The same pull request updates automatically and CI runs again.

### 7. Review and merge

Merge only after:

- **Build and test** passes;
- all three Docker image builds pass;
- required code reviews are approved;
- merge conflicts are resolved.

## GitHub repository settings

An organization administrator should protect `main` and preferably `dewni`:

1. Open **Repository Settings > Branches** or **Rules > Rulesets**.
2. Add a rule for `main`.
3. Require a pull request before merging.
4. Require status checks to pass.
5. Select `Build and test` and the Docker build checks.
6. Require the branch to be up to date before merging.
7. Block force pushes and branch deletion.

Apply a similar rule to `dewni` if it is the team's shared integration branch.

## Secrets

This CI workflow requires no Atlas, Firebase, or AWS secrets. Never add a real `.env` file to Git.

Future authenticated end-to-end tests should use dedicated test credentials stored under **Repository Settings > Secrets and variables > Actions**, never production credentials.

## CI versus CD

```text
CI: verify code and images
CD: publish images and deploy an approved version to AWS
```

The CD workflow and its AWS prerequisites are documented in the [Continuous Deployment Guide](CD_GUIDE.md). It becomes operational after the one-time ECR, ECS, IAM/OIDC, networking, and secret-management setup is complete.
