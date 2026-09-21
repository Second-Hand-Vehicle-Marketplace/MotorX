# Search Feature — Step-by-Step Build Guide

Implements FR-SEARCH-01 through FR-SEARCH-20 (`Gropu23_SRS.pdf`, §3.1.14–3.1.18, Appendix C) and closes out the search-related work in `team-work-plan.md` (the structured-search leftovers from Sprint 2, and all of Sprint 4).

**Module ownership** (`docs/backend-module-architecture.md`): the `search` module owns *structured, fuzzy, semantic, and hybrid retrieval*. The `buyers` module only owns public browsing — it should not keep growing its own filter logic once `search` exists. Per `team-work-plan.md`: **M2 owns Phase 2** (embeddings, inside the worker), **M3 owns Phases 1 (frontend/API), 3, 4, 5, 6**.

Every phase ends with a "Verify" step. Run `docker compose up -d --build <service>` after editing backend/worker/frontend source — none of the three containers use a bind mount, so a plain `docker compose up -d` will keep serving the old code (see `DEVELOPER_SETUP.md` for the full container workflow).

---

## Phase 1 — Finish structured search (FR-SEARCH-01–07)

Everything else in this guide assumes structured filtering is complete, since Appendix C runs semantic ranking *on top of* it.

1. **Add `location` and `mileage` to the query schema.**
   Edit `apps/backend/src/modules/marketplace/listing.validation.ts` — add `location` (optional string) and `mileageMin`/`mileageMax` (optional numbers) to `listListingsQuerySchema`. `location` already exists on `Listing` (`apps/backend/src/modules/marketplace/listing.model.ts:33`); it's just never exposed as a filter.

2. **Apply them in the repository.**
   Edit `apps/backend/src/modules/buyers/buyer.repository.ts` (`listBuyerListings`) — add a `location` match (regex, same style as the existing `make`/`model` matching) and a `attributes.mileageKm` range filter next to the existing `year`/`price` range filters.

3. **Mirror on the frontend.**
   - `apps/frontend/src/features/listings/types/listing.types.ts` — add `location`, `mileageMin`, `mileageMax` to `ListingFilters`.
   - `apps/frontend/src/features/buyers/services/buyerApi.ts` — pass the new params through to `GET /listings`.
   - `apps/frontend/src/portals/buyer/pages/Marketplace.tsx` — add a location input and mileage min/max inputs next to the existing year/price ones.

4. **Debounce the keyword search input** in `Marketplace.tsx` (~300ms) — it currently fires a request per keystroke.

5. **Add missing indexes.**
   In `listing.model.ts`, add compound indexes for the fields actually filtered/sorted on today with no index backing them: `price`, `year`, `attributes.fuelType`, `attributes.transmission`, `attributes.bodyType`, `attributes.condition`, `attributes.mileageKm`, `location`. Match them to real filter combinations, e.g. `{ status: 1, category: 1, price: 1 }`, `{ status: 1, location: 1 }`.

6. **(Stretch)** Move the query-param shape into `packages/shared-contracts` so the backend Zod schema and frontend `ListingFilters` type share one source instead of two hand-maintained copies.

**Verify:** `npm run test --workspace @motorx/backend` (vitest covers `listing.validation.test.ts`); then `curl "http://localhost:3000/api/v1/listings?location=Colombo&mileageMax=50000"`; rebuild (`docker compose up -d --build backend frontend`) and check the Marketplace page filters manually.

---

## Phase 2 — Embedding pipeline (FR-ETL-27–30, FR-SEARCH-15) — M2

1. **Implement the embedding call.**
   `apps/worker/src/pipeline/generateEmbedding.ts` is currently `export const generateEmbedding = () => undefined;`. Replace it with a call to the HF Inference API's feature-extraction endpoint, using `HF_API_KEY` and `HF_EMBEDDING_MODEL` (`sentence-transformers/all-MiniLM-L6-v2`, 384-dim) from the worker's env. Compose the input text from title + make + model + description + attributes.

2. **Wire it into the pipeline.**
   Nothing currently calls `generateEmbedding`, `categorize.ts`, or `enrich.ts` — all three are unwired stubs (confirmed: no imports of any of them anywhere in `apps/worker/src`). The orchestrator is `apps/worker/src/services/uploadJob.service.ts`, which today only chains `extract → detectExactDuplicates → prepareInventoryBatch (normalize+validate) → persist`. Add categorize/enrich/embedding as steps in that chain, after validation and before (or as part of) `persist.ts`, so the final saved document carries the enriched fields and the vector.

3. **Add the field to the model.**
   `listing.model.ts` — add `embedding: number[]` (Mongoose `[Number]`), populated by the pipeline step above.

4. **Create the Atlas Vector Search index.**
   In the Atlas UI (project → your cluster → Search/Vector Search tab), create a vector index on `listings.embedding`, 384 dimensions, cosine similarity. This is separate from the regular Mongo indexes added in Phase 1 and doesn't go in `listing.model.ts`.

5. **Backfill existing listings** with a one-off script that re-runs the embedding step over already-persisted documents.

6. **Keep the model consistent** — Phase 3's query-time embedding call must use the exact same `HF_EMBEDDING_MODEL` so vectors are comparable (FR-ETL-28).

**Verify:** unit test `generateEmbedding` with the HF call mocked; upload a CSV through the existing dealer upload flow and check `docker compose logs worker` for the new pipeline steps running; confirm a sample listing document in Atlas has a populated `embedding` array.

---

## Phase 3 — Natural-language query analyzer (FR-SEARCH-08–12) — M3

1. **Build out the `search` module for real.**
   `apps/backend/src/modules/search/index.ts` is currently a one-line placeholder (`export const searchModule = 'search';`). Replace it with the standard module shape used everywhere else (`routes → validation → controller → service → repository`, per `docs/backend-module-architecture.md`): `search.routes.ts`, `search.validation.ts`, `search.controller.ts`, `search.service.ts`, `search.repository.ts`.

2. **Mount the router.** In `apps/backend/src/app.ts`, add `app.use('/api/v1/search', searchRouter);` next to the other module mounts (same pattern as `listingRouter`/`buyerRouter`).

3. **Write the query analyzer** (e.g. `search.queryAnalyzer.ts`): rule-based extraction is enough per `team-work-plan.md` ("NL query parser (rule-based, in-Node — not a hosted service)") — keyword/regex dictionaries mapping transmission words, body-type/category words, "under/below X" → `priceMax`, "near `<city>`" → `location`, year mentions → `year`. Whatever tokens aren't consumed become the leftover free-text intent that Phases 4/5 use.

4. **New endpoint:** `GET /api/v1/search?q=...` — for now, have it apply the analyzer's extracted structured constraints through the same filter logic Phase 1 built (either by importing the buyers repository's filter builder or, better, moving that builder into `search.repository.ts` since `search` — not `buyers` — is supposed to own retrieval logic).

**Verify:** vitest tests for the analyzer using the SRS's own example query — `"affordable automatic SUV under 2 million near Colombo"` — asserting it extracts `category: 'suv'`, `transmission: 'automatic'`, `priceMax: 2000000`, `location: 'Colombo'`.

---

## Phase 4 — Fuzzy matching (FR-SEARCH-13) — M3

1. Add typo correction for make/model tokens ("toyata" → "toyota") before/inside the query analyzer — either a small Levenshtein/trigram check against a known make/model vocabulary, or Atlas Search's fuzzy `text` operator if a (separate, non-vector) Atlas Search index on `make`/`model`/`title` is set up.

**Verify:** feed the analyzer deliberately misspelled queries ("corola", "hyundia") and confirm they still resolve to the correct constraint values.

---

## Phase 5 — Hybrid relevance ranking (FR-SEARCH-14, 17–20) — M3

1. In `search.repository.ts`, run a `$vectorSearch` aggregation stage against the query's embedding (same model as Phase 2), passing the analyzer's structured constraints in as the stage's `filter` option — this is the pre-filtering FR-SEARCH-18 calls for.
2. Combine vector similarity with structured/fuzzy match strength into one relevance score (FR-SEARCH-20).
3. Sort by that combined score, then paginate as in Phase 1.
4. Return an explicit empty-results signal when nothing matches (US-05's acceptance criterion).

**Verify:** compare a plain keyword query against an equivalent natural-language query and confirm similar listings surface; keep the Sprint 6 performance targets in `team-work-plan.md` in mind now (structured <2s, semantic <5s) rather than retrofitting them later.

---

## Phase 6 — Frontend wiring — M3

1. Point the Marketplace search box at `GET /api/v1/search?q=...` instead of `GET /listings?search=...`.
2. Default sort becomes "relevance" whenever `q` is present; otherwise keep "Newest" as today.
3. Add the no-results empty state.

**Verify:** manual pass through the browser — structured filters still work standalone, natural-language queries return ranked results, empty queries show the right message.

---

## Recap

| Phase | Owner | SRS refs |
|---|---|---|
| 1 — Structured search gaps | M3 | FR-SEARCH-01–07 |
| 2 — Embedding pipeline | M2 | FR-ETL-27–30, FR-SEARCH-15 |
| 3 — NL query analyzer | M3 | FR-SEARCH-08–12 |
| 4 — Fuzzy matching | M3 | FR-SEARCH-13 |
| 5 — Hybrid ranking | M3 | FR-SEARCH-14, 17–20 |
| 6 — Frontend wiring | M3 | US-05, US-06 |

Phase 2 can happen in parallel with Phase 3 once Phase 1 is merged — they don't depend on each other, only on each other's output arriving before Phase 5.
