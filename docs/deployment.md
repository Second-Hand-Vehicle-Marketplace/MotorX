# Deployment

Use Docker Compose for local development and GitHub Actions for automated verification and deployment.

- [Continuous Integration Guide](CI_GUIDE.md)
- [Continuous Deployment Guide](CD_GUIDE.md)

Production uses ECR-hosted images and independently deployable ECS services for the backend, ETL worker, and frontend. Server-side secrets remain in AWS Secrets Manager; GitHub authenticates to AWS with short-lived OIDC credentials.
