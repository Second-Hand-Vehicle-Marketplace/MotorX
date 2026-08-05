# MotorX

MotorX is a second-hand vehicle marketplace with intelligent search and automated inventory processing.

## Architecture

The system follows a modular monolith design with a separate asynchronous ETL worker.

- Frontend: React + TypeScript web client
- Backend: Node.js + Express modular monolith
- Worker: asynchronous ETL processor for CSV inventory uploads
- Database: MongoDB Atlas
- Queue: Redis + BullMQ
- File storage: AWS S3 in production
- Authentication: Firebase Authentication
- Search: structured filters, fuzzy matching, semantic similarity, and hybrid ranking
- Embeddings: Hugging Face model integration for semantic search

## Core Modules

- Auth & Users
- Dealers
- Marketplace
- Inventory Upload
- ETL Processing
- Search
- Notifications
- Administration

## Repository Layout

```text
MotorX/
├─ frontend/    # Web client
├─ backend/     # Main API and business modules
├─ worker/      # Background ETL worker
├─ shared/      # Shared types, utilities, and contracts
├─ infra/       # Docker, deployment, and environment setup
└─ docs/        # Supporting documentation
```

## SRS Alignment

This repository structure reflects the SRS by separating interactive marketplace features from long-running inventory processing.

- Dealers upload CSV inventory files through the frontend
- The backend validates uploads and creates processing jobs
- The worker processes jobs asynchronously
- Buyers search listings using structured filters and intelligent natural-language search
- Administrators monitor users, listings, uploads, and system health

## Next Steps

1. Initialize the frontend and backend projects.
2. Add API contracts and shared types.
3. Add Docker and environment configuration under `infra/`.
4. Implement the upload, ETL, and search modules.
