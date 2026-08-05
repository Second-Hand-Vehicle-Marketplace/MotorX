# MotorX Sprint Plan

This plan breaks the SRS and the dealer use-case diagram into implementation sprints.

## Sprint 0: Project Foundation

Goal: establish the baseline architecture and repository structure.

Scope:
- Set up the frontend, backend, worker, shared, infra, and docs folders.
- Define the modular monolith boundaries.
- Add environment configuration, Docker support, and shared contracts.

Deliverables:
- Repository scaffold
- Base development environment
- Shared architecture conventions

## Sprint 1: Authentication and Dealer Onboarding

Goal: implement secure access and dealer account setup.

Scope:
- Firebase Authentication login and token verification.
- Role-based access control for Buyer, Dealer, and Administrator.
- Dealer profile creation and editing.
- Dealer account request and approval flow.

References:
- FR-USER-01 to FR-USER-11
- FR-DEALER-01 to FR-DEALER-12
- PSR-08 to PSR-12

Deliverables:
- Login flow
- Protected API routes
- Dealer profile management
- Dealer approval workflow

## Sprint 2: Vehicle Listings and Marketplace Browsing

Goal: let dealers manage vehicles and let buyers browse listings.

Scope:
- Create and update vehicle listings.
- Manage listing availability.
- View vehicle details and dealer information.
- Upload and manage vehicle images.

References:
- FR-MARKET-01 to FR-MARKET-16
- US-04 and US-07

Deliverables:
- Dealer listing management screens
- Buyer marketplace listing cards
- Vehicle detail view
- Image upload and display support

## Sprint 3: Inventory Upload and Storage

Goal: support dealer CSV uploads and preserve original files.

Scope:
- CSV file upload validation.
- Object storage persistence for original files.
- Upload job creation and status tracking.
- Upload history and progress views.

References:
- FR-UPLOAD-01 to FR-UPLOAD-07
- FR-DEALER-05 to FR-DEALER-08
- UC-01

Deliverables:
- Inventory upload flow
- Upload job records
- Processing status pages
- Upload history dashboard

## Sprint 4: Asynchronous ETL Processing

Goal: process inventory files without blocking normal API use.

Scope:
- Queue accepted uploads in BullMQ.
- Build the ETL worker.
- Normalize, validate, and batch records.
- Detect duplicates and reject invalid rows.
- Enrich records and generate embeddings.
- Save valid listings and rejected record details.

References:
- FR-ETL-01 to FR-ETL-33
- RR-02 to RR-08
- PSR-04 to PSR-06
- UC-01

Deliverables:
- Worker pipeline
- Partial processing support
- Rejected record reporting
- Processing summaries and notifications

## Sprint 5: Intelligent Search

Goal: let buyers find vehicles using structured and natural-language search.

Scope:
- Structured filters for make, model, price, year, mileage, fuel, transmission, category, location, and availability.
- Sorting and pagination.
- Natural-language query parsing.
- Fuzzy matching and semantic similarity search.
- Hybrid ranking.

References:
- FR-SEARCH-01 to FR-SEARCH-20
- UC-02
- Appendix C

Deliverables:
- Search API
- Search UI filters and input
- Query interpretation layer
- Ranked search results

## Sprint 6: Notifications and Administration

Goal: give dealers processing feedback and administrators operational visibility.

Scope:
- In-app upload completion and failure notifications.
- Administrative views for users, dealers, listings, and uploads.
- System health and activity monitoring.
- Audit logging for significant operations.

References:
- FR-NOTIFY-01 to FR-NOTIFY-06
- FR-ADMIN-01 to FR-ADMIN-10
- UC-03

Deliverables:
- Notification center
- Admin dashboard
- Health/status panels
- Audit log records

## Release Milestone

A production-ready release should include:
- Authentication and RBAC
- Dealer profile and inventory management
- CSV upload and asynchronous ETL processing
- Marketplace browsing and listing details
- Structured and intelligent search
- Notifications and administration

## Notes

- The sprint order is designed to unlock the dealer upload workflow first, because it feeds the marketplace and search features.
- ETL and search are separated into later sprints because they depend on the inventory and listing data model.
- This plan can be refined once the team defines sprint length and capacity.
