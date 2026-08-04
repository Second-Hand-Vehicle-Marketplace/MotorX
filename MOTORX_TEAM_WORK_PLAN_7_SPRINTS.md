# MotorX — Team Work Plan (3 Members, 7 Sprints)
*Aligned to SRS v1.0 (02/Aug/2026) — Group 23*

**Team:** Member 1 — Auth, Dealer & Marketplace · Member 2 — Inventory & ETL · Member 3 — Search, Notifications & Admin

Each sprint = 1–2 weeks. Work within each sprint follows: **Database → Backend → Frontend → Integration → Testing**. FR/NFR IDs from the SRS are tagged in brackets so each task traces back to a requirement — useful for your traceability appendix (Appendix D) later.

---

## Architecture confirmation (SRS §2.1, §3.6.1, §3.8)

This plan assumes exactly the SRS architecture — no changes needed:
- **Modular monolithic backend** (Node.js/Express) with logical modules: Auth & Users, Dealers, Marketplace, Inventory, Search, Notifications, Administration [DC-01]
- **Separate asynchronous ETL worker**, decoupled from the API via Redis/BullMQ [DC-02, FR-ETL-01–04]
- **MongoDB Atlas** as the single database, collections split by domain [DC-03, §3.10]
- **Firebase Authentication** for identity; backend verifies Firebase ID tokens (JWT) via Admin SDK [FR-USER-04–06]
- **AWS S3** for original file + image storage, never in MongoDB [DC-04, FR-UPLOAD-04]
- **Hugging Face model** for embeddings — same model used for both listing and query vectors [FR-ETL-27–30, FR-SEARCH-15]
- **Docker + GitHub Actions** for containerization/CI-CD [SR-08]

## Ownership Summary

| Member | Owns | SRS Modules | Core Features |
|---|---|---|---|
| **M1** | Identity, Dealer & Marketplace | Auth & Users, Dealers, Marketplace | Auth, RBAC, dealer approval, listings, images |
| **M2** | Inventory & ETL | Inventory | CSV upload, S3, Redis, BullMQ, ETL, validation, dedup, embeddings |
| **M3** | Search, Notifications & Admin | Search, Notifications, Administration | Structured/NLP/fuzzy/semantic search, ranking, notifications, admin |

**Shared contracts to lock in Sprint 0** (everything else depends on these): MongoDB schema (§3.10), API endpoint naming, Firebase auth/token handling, standard error/response format, embedding model + vector format, upload job status enum (Pending/Processing/Completed/CompletedWithErrors/Failed) [FR-ETL-31], Git branch strategy.

---

## Sprint 0 — Architecture & Setup (2–3 days, all members together)
- System architecture, modular monolith module boundaries [DC-01]
- API conventions, error-handling format, response format
- Git branching strategy, env vars, Docker Compose skeleton
- Auth flow (Firebase → JWT → `Authorization: Bearer`) agreed [FR-USER-06]
- DB naming conventions, index-naming conventions

## Sprint 1 — Database Foundation + Authentication
| M1 | M2 | M3 |
|---|---|---|
| `Users` (firebaseUid, email, role, accountStatus, profile…) [§3.10]; unique indexes on `firebaseUid`, `email` [FR-USER-03] | `UploadJobs`, `RejectedRecords` collections [§3.10] | Search fields on `Listings` (make/model/price/…/embedding) + indexes [§3.10] |
| Firebase Auth + Admin SDK, ID token verification middleware, RBAC middleware for Buyer/Dealer/Administrator [FR-USER-04–11] | CSV upload endpoint, file type/size validation, upload job creation, S3 integration [FR-UPLOAD-01–06] | Listing retrieval, search endpoint scaffold, pagination/sorting; admin auth middleware [FR-ADMIN-01] |
| Login, registration, logout, protected/role-based routes | CSV upload page, file selector + validation messages, upload history/status [FR-UPLOAD-07] | Marketplace page, vehicle cards, basic search bar, pagination UI; basic admin dashboard shell |

## Sprint 2 — Dealer & Marketplace + ETL Core + Structured Search
| M1 | M2 | M3 |
|---|---|---|
| `Dealers`, `Listings` collections + indexes on `dealerId`, `availability`, `price`, `year`, `make`, `model` [§3.10] | Finalize UploadJobs/RejectedRecords/Listings relationships | Indexes for price/year/mileage/make/model/fuelType/transmission/category/location/availability [§3.10] |
| Dealer account request flow, admin approval, **Dealer role granted only after approval** [FR-DEALER-09–12]; listing CRUD; ownership checks — dealer A cannot touch dealer B's listings [FR-MARKET-01–06, FR-USER-09] | Redis + BullMQ producer/worker, CSV parser, batch processing, status tracking (Pending→Processing→Completed…) [FR-ETL-01–06] | `GET /search` with combinable filters (make/model/price/year/mileage/fuel/transmission/category/location/availability) [FR-SEARCH-01–04], sorting [FR-SEARCH-05], pagination [FR-SEARCH-06–07] |
| Dealer account request UI, dealer profile page + dashboard, add/edit/delete vehicle [FR-DEALER-01–08] | Processing status + stats UI (successful/rejected/duplicate counts) | Filter sidebar, sort controls, pagination UI |

## Sprint 3 — Advanced ETL + Intelligent Search
| M1 | M2 | M3 |
|---|---|---|
| Image upload/validate (type, size)/replace/delete, S3 integration [FR-MARKET-12–15] | Full pipeline: Extract → Normalize → Validate → Duplicate Detection → Categorize → Enrich → Embed → Store [FR-ETL-07–30] | NLP query parsing: "affordable automatic SUV under 2M near Colombo" → structured constraints + remaining intent [FR-SEARCH-08–12] — **rule-based parser in Node.js**, not an external NLP service, per project's tech decision |
| Multi-image gallery, preview, delete, improved vehicle detail page [FR-MARKET-16] | Normalization rules (casing, whitespace, price formats like "25 lakh"/"2.5M"); validation (missing/invalid fields) [FR-ETL-07–12]; **partial success — valid rows still insert even if others fail** [FR-ETL-13–15]; duplicate detection using dealerId+make+model+year+mileage [FR-ETL-19–22] | Fuzzy matching for typos [FR-SEARCH-13]; semantic search via Hugging Face embeddings, same model for query + listing vectors [FR-SEARCH-14–15]; NL search bar, suggestions, no-result handling |

## Sprint 4 — Hybrid Search + Notifications + Administration
| M1 | M2 | M3 |
|---|---|---|
| Dealer dashboard stats (total/active/inactive listings, upload jobs, errors) [FR-DEALER-05–08] | Retry failed jobs [RR-07], duplicate-listing prevention on reprocess [RR-08], ETL logging [SR-05], rejected-record API + downloadable report [FR-ETL-16–18], corrected-file re-upload [UC-01 alt. flow] | Hybrid ranking: `0.50×Structured + 0.20×Fuzzy + 0.30×Semantic` (tune experimentally) [FR-SEARCH-17–20] |
| Dashboard UI | Rejected records table w/ reasons, download, re-upload flow | **Notifications**: processing complete/failed/summary, tied to the correct `userId`, users cannot see others' notifications [FR-NOTIFY-01–05]. **Admin**: user/dealer/listing/upload monitoring, **system health for backend + DB + queue + ETL worker** [FR-ADMIN-07–08], **audit logs for admin actions** [FR-ADMIN-06], system-level stats (total listings, total dealers) [FR-ADMIN-10] |

## Sprint 5 — Integration & Testing (all members together)
- **M1 tests:** registration, login, RBAC, dealer approval, listing CRUD, image mgmt, ownership restrictions [FR-USER, FR-DEALER, FR-MARKET]
- **M2 tests:** upload, validation, queue processing, ETL, normalization, duplicate detection, partial success, retry, embeddings [FR-UPLOAD, FR-ETL, RR-05–08]
- **M3 tests:** structured/NL/fuzzy/semantic search, hybrid ranking, notifications, admin functions [FR-SEARCH, FR-NOTIFY, FR-ADMIN]
- **Cross-integration tests (together)** — map directly to UC-01/UC-02/UC-03:
  1. **UC-01**: Dealer login → CSV upload → S3 → BullMQ → ETL worker → validation → dedup → listings → embedding → search index → buyer search
  2. **UC-02**: Buyer NL query → query analyzer → structured constraints → DB filtering → semantic search → hybrid ranking → results
  3. **Security**: Dealer A attempts to edit Dealer B's listing → authorization middleware → 403 Forbidden [FR-USER-09, PSR-15]
  4. **ETL partial failure**: 1000 records → ~900 valid / 50 invalid / 50 duplicate → 900 listings created, 100 issues reported [FR-ETL-13–18]
  5. **UC-03**: Admin dashboard shows total vehicles, total dealers, system health, recent uploads/errors

## Sprint 6 — Finalization & Deployment
| M1 | M2 | M3 |
|---|---|---|
| Bug fixes, responsive UI (desktop/tablet/mobile) [UR-16–17], auth security review, dealer workflow testing, API docs | ETL performance optimization, Dockerize worker, Redis/S3 config, **test 5,000-record upload completes within 2 minutes** [PSR-05], ETL monitoring | Search performance tuning (structured <2s [PSR-02], semantic <5s [PSR-03]), ranking tuning, relevance testing, admin dashboard polish, system health monitoring |

**All members together:**
- Docker Compose finalization, env vars, CI/CD (GitHub Actions), production config
- Security testing: HTTPS enforced [PSR-10], input validation/sanitization [PSR-13], OWASP ASVS checks [§3.12], no passwords stored in MongoDB (Firebase handles auth) [PSR-11]
- Performance testing against targets: 95% of API calls <2s [PSR-01], scalability target of 1,000 dealer accounts / 100,000 listings / 10,000 concurrent users [PSR-07] — note this is a long-term target, not a Sprint-6 load test requirement; a smaller representative load test is enough for the academic deliverable
- Final documentation, SRS updates, UML diagrams, deployment, final presentation

---

## UML Diagram Assignments
- **M1:** Dealer Use Case Diagram
- **M2:** ETL/Inventory Activity or Sequence Diagram (mirrors Appendix B of the SRS)
- **M3:** Buyer Search + Administrator Use Case Diagrams
- **Together:** System-Level Use Case Diagram (Note: the SRS deliberately omits formal use-case diagrams in favor of the written use cases in §5 — if your module/course requires diagrams, these should be produced as a *supplementary* artifact, not a replacement for §5)

---

## Gaps closed vs. the earlier draft plan

These SRS requirements weren't explicit in the first draft and are now called out above:
1. **Dealer approval workflow** — role is granted only *after* admin approval, not at registration [FR-DEALER-09–12] (Sprint 2, M1)
2. **Admin system health monitoring** — must show backend, DB, queue, *and* ETL worker status individually, not just "system health" generically [FR-ADMIN-07–08] (Sprint 4, M3)
3. **Audit logs** — explicit collection + task, not just implied by "admin monitoring" [FR-ADMIN-06] (Sprint 4, M3)
4. **Notification privacy** — a user must never see another user's notifications [FR-NOTIFY-04–05] (Sprint 4, M3)
5. **NL search is a rule-based parser**, not a hosted NLP/LLM service — matches your recorded tech decision and keeps Sprint 3 scope realistic for a 3-person team (Sprint 3, M3)
6. **Embedding model consistency** — same Hugging Face model must generate both listing and query vectors, or semantic search silently breaks [FR-SEARCH-15] (Sprint 3, M3)
7. **Performance targets scoped realistically** — PSR-07's 10,000-concurrent-user target is a long-term scalability goal per the SRS itself, not something to load-test in Sprint 6; flagged so the team doesn't over-invest there (Sprint 6)

## Suggested Folder/API Structure
```
/api
   /auth
   /users
   /dealers
   /listings
   /inventory
   /search
   /notifications
   /admin
```
