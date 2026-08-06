# Architecture

MotorX uses a modular monolith backend with feature modules for auth, dealers, marketplace, inventory, search, notifications, and admin.

Backend and worker keep separate data-access code. The worker owns its own repositories and pipeline services, while shared code stays limited to `packages/shared-contracts` types, DTOs, and enums.

The backend middleware layer includes `loadLocalUser.ts` for the pipeline that loads or creates the local user document after Firebase authentication.

Health endpoints are explicit application routes: `GET /health/live`, `GET /health/ready`, and `GET /health` for operational status across backend, database, queue, and worker.

Vehicle image uploads are backend-mediated: the dealer selects an image, the frontend submits multipart form data to the backend, the backend validates MIME type, extension, size, and listing ownership, then uploads to S3-compatible storage and stores image metadata in `listings.images[]`.

The ETL worker owns notification creation for inventory jobs. It creates the in-app notification, may send the completion email, and updates `emailStatus` when email delivery is attempted.

Zod is the selected validation library for request validation and shared schemas.
