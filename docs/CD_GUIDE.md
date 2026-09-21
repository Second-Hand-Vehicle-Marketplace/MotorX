# MotorX Continuous Deployment Guide

MotorX production deployment uses GitHub Actions, Amazon ECR, and Amazon ECS Fargate. CI verifies a commit first. CD then publishes immutable Docker images and performs rolling ECS deployments.

## Release flow

```text
feature branch -> pull request -> CI -> merge to main -> CI -> production approval -> CD
                                                              |
                                                              +-> ECR images tagged with commit SHA
                                                              +-> ECS worker/backend/frontend update
                                                              +-> ECS stability checks
                                                              +-> production health check
```

The workflow is [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml). It starts automatically only after the `CI` workflow succeeds for `main`. It can also be started manually from `main`.

## Production architecture expected by CD

- Three private ECR repositories: `motorx-backend`, `motorx-worker`, and `motorx-frontend`.
- One ECS cluster, normally `motorx-production`.
- Three Fargate services and task-definition families, normally using the same names as the repositories.
- Backend and frontend services behind an HTTPS Application Load Balancer.
- Worker service without a public listener.
- MongoDB Atlas for persistent data.
- A managed Redis endpoint for BullMQ.
- Amazon S3 for uploads and images.
- AWS Secrets Manager for server-side secrets.
- CloudWatch Logs for container logs.

The checked-in production frontend image uses Nginx, serves the React SPA on port `80`, and exposes `/healthz` for ECS health checks.

## One-time AWS setup

Choose one AWS region and use it for ECR, ECS, IAM configuration, logs, and S3 examples below.

### 1. Create the ECR repositories

```powershell
aws ecr create-repository --repository-name motorx-backend --image-scanning-configuration scanOnPush=true
aws ecr create-repository --repository-name motorx-worker --image-scanning-configuration scanOnPush=true
aws ecr create-repository --repository-name motorx-frontend --image-scanning-configuration scanOnPush=true
```

Enable immutable tags on each repository so a commit-SHA release cannot be overwritten:

```powershell
aws ecr put-image-tag-mutability --repository-name motorx-backend --image-tag-mutability IMMUTABLE
aws ecr put-image-tag-mutability --repository-name motorx-worker --image-tag-mutability IMMUTABLE
aws ecr put-image-tag-mutability --repository-name motorx-frontend --image-tag-mutability IMMUTABLE
```

### 2. Create application infrastructure

Create the following through AWS Console, CloudFormation, Terraform, or your institution's AWS lab tooling:

1. A VPC with at least two subnets in different Availability Zones.
2. An HTTPS Application Load Balancer with an ACM certificate.
3. An ECS Fargate cluster named `motorx-production`.
4. Backend, worker, and frontend task definitions and services.
5. An S3 bucket for MotorX objects.
6. A Redis service reachable only from the backend and worker security groups.
7. CloudWatch log groups for all three containers.

Recommended task settings:

| Service | Container name | Port | Health check | Initial desired count |
|---|---|---:|---|---:|
| Backend | `backend` | 3000 | `/health/live` | 1 |
| Worker | `worker` | none | ECS process health | 1 |
| Frontend | `frontend` | 80 | `/healthz` | 1 |

Enable the ECS rolling-deployment circuit breaker with automatic rollback for every service:

```powershell
aws ecs update-service --cluster motorx-production --service motorx-backend --deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true}"
aws ecs update-service --cluster motorx-production --service motorx-worker --deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true}"
aws ecs update-service --cluster motorx-production --service motorx-frontend --deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true}"
```

The load balancer should route `/api/*` and `/health/*` to the backend target group and all other paths to the frontend target group.

### 3. Store runtime secrets outside GitHub

Put server-side secrets in AWS Secrets Manager and reference their ARNs from the ECS task definition's `secrets` section. Typical backend/worker values include:

- `MONGODB_URI`
- `REDIS_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `HF_API_KEY`

Non-secret runtime configuration belongs in the task definition's `environment` section, including `NODE_ENV=production`, S3 bucket/region, CORS origin, queue name, and limits.

Do not put application secrets in the GitHub workflow or frontend `VITE_*` variables. Vite variables are embedded in the browser bundle and are public configuration.

Give the ECS task execution role permission to pull ECR images, write CloudWatch logs, and retrieve only the Secrets Manager values referenced by the tasks. Give the application task role only the required S3 bucket permissions.

### 4. Configure MongoDB Atlas and networking

Allow the stable outbound address of the ECS networking path, or establish private connectivity supported by your Atlas plan. Do not allow `0.0.0.0/0` for production.

The ECS security groups should enforce:

- Internet -> ALB: HTTPS 443 only.
- ALB -> backend: TCP 3000 only.
- ALB -> frontend: TCP 80 only.
- Backend/worker -> Redis: Redis port only.
- Backend/worker -> Atlas, S3, Firebase, and Hugging Face: required outbound HTTPS/database traffic.
- No public inbound traffic to worker or Redis.

### 5. Add the GitHub OIDC provider

In **AWS IAM > Identity providers**, add an OpenID Connect provider:

```text
Provider URL: https://token.actions.githubusercontent.com
Audience:     sts.amazonaws.com
```

If the provider already exists in the AWS account, reuse it. Record its ARN.

### 6. Create the GitHub deployment role

Deploy the supplied CloudFormation template after replacing the example parameter values:

```powershell
aws cloudformation deploy `
  --stack-name motorx-github-deploy-role `
  --template-file infrastructure/aws/github-actions-deploy-role.yml `
  --capabilities CAPABILITY_NAMED_IAM `
  --parameter-overrides `
    GitHubOwner=YOUR_GITHUB_OWNER `
    GitHubRepository=MotorX `
    GitHubOidcProviderArn=arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com `
    EcsClusterName=motorx-production `
    TaskExecutionRoleArn=arn:aws:iam::123456789012:role/ecsTaskExecutionRole `
    TaskRoleArn=arn:aws:iam::123456789012:role/motorxTaskRole
```

Read the role ARN:

```powershell
aws cloudformation describe-stacks `
  --stack-name motorx-github-deploy-role `
  --query "Stacks[0].Outputs[?OutputKey=='DeployRoleArn'].OutputValue" `
  --output text
```

OIDC gives each workflow run short-lived credentials. No AWS access-key ID or secret access key is stored in GitHub.

## GitHub production environment

Create **Repository Settings > Environments > production**. Restrict deployment branches to `main`. If your GitHub plan supports it, add a required reviewer and prevent self-review.

Add these environment variables:

| Variable | Example |
|---|---|
| `AWS_REGION` | `ap-southeast-1` |
| `AWS_ROLE_TO_ASSUME` | CloudFormation output role ARN |
| `ECS_CLUSTER` | `motorx-production` |
| `ECS_BACKEND_SERVICE` | `motorx-backend` |
| `ECS_BACKEND_TASK_FAMILY` | `motorx-backend` |
| `ECS_BACKEND_CONTAINER` | `backend` |
| `ECS_WORKER_SERVICE` | `motorx-worker` |
| `ECS_WORKER_TASK_FAMILY` | `motorx-worker` |
| `ECS_WORKER_CONTAINER` | `worker` |
| `ECS_FRONTEND_SERVICE` | `motorx-frontend` |
| `ECS_FRONTEND_TASK_FAMILY` | `motorx-frontend` |
| `ECS_FRONTEND_CONTAINER` | `frontend` |
| `ECR_BACKEND_REPOSITORY` | `motorx-backend` |
| `ECR_WORKER_REPOSITORY` | `motorx-worker` |
| `ECR_FRONTEND_REPOSITORY` | `motorx-frontend` |
| `PRODUCTION_URL` | `https://motorx.example.com` |
| `PRODUCTION_HEALTH_URL` | `https://motorx.example.com/health/live` |
| `VITE_API_BASE_URL` | `https://motorx.example.com/api/v1` |
| `VITE_FIREBASE_API_KEY` | Firebase web-app configuration |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase web-app configuration |
| `VITE_FIREBASE_PROJECT_ID` | Firebase web-app configuration |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase web-app configuration |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase web-app configuration |
| `VITE_FIREBASE_APP_ID` | Firebase web-app configuration |

No GitHub environment secrets are required for AWS authentication. Runtime application secrets stay in AWS Secrets Manager and remain attached to ECS task definitions when CD replaces only their image fields.

## Normal team release process

1. Create a feature branch from `dewni`.
2. Open a pull request into `dewni` and pass CI/review.
3. When the release is ready, open a pull request from `dewni` into `main`.
4. Pass CI and merge into `main`.
5. The successful `main` CI run starts **Deploy production**.
6. Approve the protected `production` environment when prompted.
7. Watch image publication, ECS stability, and production health-check steps.

Each ECR image is tagged with the exact tested Git commit SHA. The workflow does not use a mutable `latest` tag.

## Failure and rollback

If a new task cannot become healthy, the ECS deployment circuit breaker returns that individual service to its last successful task definition. The GitHub job fails and must not be rerun until its logs and ECS service events have been investigated.

Useful commands:

```powershell
aws ecs describe-services --cluster motorx-production --services motorx-backend motorx-worker motorx-frontend
aws ecs list-tasks --cluster motorx-production --service-name motorx-backend
aws logs tail /ecs/motorx-backend --follow
```

To redeploy a known commit manually, open **Actions > Deploy production > Run workflow**, select `main`, and run it. Because ECR tags are immutable, an already-published SHA cannot be overwritten; use the ECS task-definition history to select an older known-good revision when a manual rollback is required.

## Cost warning

ECS Fargate, an Application Load Balancer, managed Redis, NAT gateways, public IPv4 addresses, CloudWatch, S3, and data transfer can incur charges. Configure AWS Budgets before provisioning. A university lab or AWS Academy account may also restrict IAM, OIDC, NAT, or Fargate features.
