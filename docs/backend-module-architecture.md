# Backend Module Architecture

Each business module follows this dependency direction:

`routes -> validation/middleware -> controller -> service -> repository -> model`

- Routes define URLs, authorization, and request validation.
- Controllers translate HTTP input and output only.
- Services enforce business rules and coordinate transactions.
- Repositories contain database queries only.
- Models define persistent MongoDB documents and indexes.
- Storage files isolate object-storage operations.

Modules must not place another actor's use cases in their own controller or service. Cross-module model access is allowed from a repository when an atomic business transaction requires it.

## Module ownership

| Module | Owns | Does not own |
|---|---|---|
| `auth-users` | Firebase identity synchronization, current-user profile, roles and account status | Administrative user suspension |
| `dealers` | Dealer application submission, applicant status, dealer-owned profile behavior, verification-document storage | Approval, rejection, admin review queues |
| `buyers` | Public marketplace browsing and active vehicle details | Dealer listing mutation or administrative moderation |
| `admin` | User administration, dealer review, listing moderation, audit logs, upload monitoring, statistics, system health | Dealer submission or listing creation |
| `marketplace` | Public listings, dealer-owned listing lifecycle, listing images | Administrative moderation decisions |
| `inventory` | Upload jobs, rejected records, dealer upload APIs, queue publication | Platform-wide admin monitoring |
| `search` | Structured, fuzzy, semantic, and hybrid retrieval | Listing mutation |
| `notifications` | User-scoped notifications and delivery state | ETL processing itself |

The standalone worker mirrors the same separation: configuration owns external connections, jobs validate queue messages, services coordinate ETL stages, pipeline files transform streamed records, and repositories update worker-owned database state.

## Dealer approval flow

1. `admin.routes.ts` authenticates and authorizes the administrator.
2. `admin.validation.ts` validates IDs, document indexes, and rejection reasons.
3. `admin.controller.ts` translates the HTTP request.
4. `admin.service.ts` reviews the pending application transactionally.
5. `admin.repository.ts` updates the dealer record, promotes the user, and stores the audit event.
6. `admin.model.ts` persists the audit entry; `dealer.model.ts` remains the owner of dealer application data.

The transaction ensures approval status, Dealer role assignment, reviewer metadata, and audit information succeed or fail together.

## Comment convention

Functions receive one short comment when their purpose, business rule, security behavior, transaction, or side effect is not obvious from the signature. Comments describe why the function exists or what invariant it protects; they do not restate individual code statements.
