# MotorX Search System Change Report

## 1. Executive summary

The MotorX buyer search capability was changed from a basic marketplace keyword/filter implementation into a complete search subsystem. The delivered system now supports structured filtering, natural-language interpretation, typo correction, semantic embeddings, bounded hybrid ranking, graceful fallback behavior, an accessible buyer interface, and production-oriented database and frontend performance controls.

The work covered the backend API, MongoDB schema and indexes, ETL worker, shared contracts, frontend application, automated tests, environment configuration, and deployment documentation.

The three questions used throughout this report are:

- **What changed?** The component, behavior, contract, or configuration that was added or modified.
- **Why was it changed?** The functional requirement, quality problem, risk, or user need addressed by the change.
- **How was it implemented?** The concrete technical approach used in MotorX.

## 2. System behavior before and after

| Area | Before | After |
|---|---|---|
| Structured filters | Make, model, category, fuel, transmission, condition, body type, year, and price | Existing filters plus location and minimum/maximum mileage, with range consistency validation |
| Search ownership | Search logic existed inside the buyer repository; the search module was a placeholder | The search module owns reusable filtering and intelligent retrieval; buyer browsing delegates to it |
| Natural language | Not implemented | Rule-based extraction of price, mileage, year, location, vehicle type, body type, fuel, transmission, condition, make, and model |
| Typo handling | Exact or regex matching only | Bounded edit-distance correction for known makes and models |
| Semantic search | No real semantic search route | 384-dimensional listing/query embeddings and Atlas Vector Search integration |
| Ranking | Database sort only | Structured-only execution or combined semantic and lexical relevance ranking |
| Failure behavior | Search failed when its data/API path failed | Semantic failures degrade to lexical ranking; the UI provides retry and preserves previous results during refresh |
| Frontend requests | One request could be generated for every input change | Natural-language input is debounced by 350 milliseconds |
| Frontend loading | All route screens were included in a large initial bundle | Route-level lazy loading and stable vendor chunks |
| Existing listings | No embedding migration mechanism | Repeatable embedding backfill command with missing-only and `--all` modes |

## 3. Structured filtering and validation

### 3.1 Location and mileage filters

**What changed**

The listing query contract now accepts:

- `location`
- `mileageMin`
- `mileageMax`

Matching frontend filter fields and TypeScript types were added.

**Why it changed**

Location and mileage are major buyer decision criteria and were already part of listing data, but were not searchable. Without them, the structured-search requirements were incomplete and natural-language phrases such as “near Colombo” or “under 50,000 km” could not be applied accurately.

**How it works**

The backend validates location as bounded trimmed text and mileage as non-negative numbers. The shared repository applies a case-insensitive location match and a MongoDB range expression against `attributes.mileageKm`. The marketplace exposes corresponding input controls and forwards them to either browse or natural-language search.

### 3.2 Range consistency checks

**What changed**

Year, price, and mileage filters now reject an inverted range, such as `priceMin=2000000` with `priceMax=1000000`.

**Why it changed**

An inverted range can never return a valid result and previously caused unnecessary database work while presenting an unexplained empty result to the user.

**How it works**

Zod `superRefine` checks compare each minimum/maximum pair. Invalid requests return the project’s standard HTTP 400 validation envelope before reaching MongoDB.

### 3.3 Bounded requests

**What changed**

Natural-language queries are limited to 200 characters, search pages to 50 results, and all pagination values must be positive integers.

**Why it changed**

Public search endpoints need predictable CPU, memory, provider, and database costs. Bounds also reduce abuse potential and prevent accidental oversized requests.

**How it works**

The search route runs all query parameters through `searchQuerySchema` before the controller executes. Invalid values never enter the analyzer, regular expressions, embedding provider, or database.

## 4. Search architecture

### 4.1 Dedicated search module

**What changed**

The one-line search placeholder was replaced with:

- `search.routes.ts`
- `search.validation.ts`
- `search.controller.ts`
- `search.service.ts`
- `search.repository.ts`
- `search.queryAnalyzer.ts`
- `search.embedding.ts`

The router is mounted at `GET /api/v1/search`.

**Why it changed**

Search combines validation, interpretation, structured retrieval, vector retrieval, ranking, and degradation logic. Keeping all of this in the buyer repository would mix public-page behavior with retrieval infrastructure and cause duplicated filter rules.

**How it works**

The request flows through a standard module chain:

```text
HTTP request
  -> validation
  -> controller
  -> query analyzer
  -> search service
  -> structured/vector repositories
  -> ranking and pagination
  -> standard API response
```

The buyer browse repository now delegates to `listStructuredListings`, ensuring browse and intelligent search apply the same public-listing rules.

### 4.2 Single reusable filter builder

**What changed**

All marketplace retrieval now uses one `buildListingFilter` function.

**Why it changed**

Separate filter implementations can drift. A field might work in the sidebar but not in natural language, or one route might accidentally expose inactive listings.

**How it works**

The builder always begins with `status: active`, then adds validated make, model, location, category, attribute, and numeric range conditions. Both `/listings` and `/search` reuse it.

## 5. Natural-language query interpretation

### 5.1 Rule-based analyzer

**What changed**

Queries such as:

```text
affordable automatic SUV under 2 million near Colombo
```

are converted into structured search constraints.

**Why it changed**

Buyers should not need to understand database field names or configure every sidebar input. The SRS explicitly requires natural-language extraction, and a local rules engine avoids adding another hosted AI dependency for deterministic information.

**How it works**

The analyzer:

1. Normalizes casing, whitespace, and unsupported punctuation.
2. Extracts mileage expressions before price expressions so “under 50,000 km” cannot be mistaken for a price.
3. Recognizes million, lakh, and thousand units.
4. Extracts exact years and “after/before” ranges.
5. Extracts location phrases introduced by “near,” “around,” or “in.”
6. Maps vehicle, fuel, transmission, condition, and body-style vocabulary to stored enum values.
7. Detects known makes and models.
8. Returns unconsumed meaningful words as residual semantic intent.

For example, “SUV” becomes `category=car` and `bodyType=suv`, matching the actual MotorX data model instead of inventing an invalid top-level `suv` category.

### 5.2 Fuzzy make and model correction

**What changed**

Common errors such as `toyata`, `corola`, and `hyundia` can be corrected to known vocabulary.

**Why it changed**

Exact matching makes small typing mistakes appear to have no inventory. This creates false zero-result searches and makes the product feel unreliable.

**How it works**

A bounded Levenshtein edit-distance calculation compares eligible tokens against a controlled make/model vocabulary. Short terms permit one edit and longer terms permit up to two. The correction is returned in `correctedTerms`, allowing future UI feedback or analytics without silently losing the original query.

## 6. Embedding generation and semantic search

### 6.1 Shared 384-dimensional embedding contract

**What changed**

The earlier 32-value character-position hash was replaced with a shared 384-dimensional normalized embedding contract.

**Why it changed**

Character-position hashes do not represent meaning and cannot satisfy semantic search. Listing and query vectors must also have identical dimensions and normalization rules for cosine similarity to be meaningful.

**How it works**

The shared-contract package provides:

- The fixed dimension count (`384`).
- Listing text composition from title, make, model, year, category, location, description, and attributes.
- Provider response normalization.
- A deterministic normalized local token embedding when no hosted key is configured.

When `HF_API_KEY` is configured, the backend and worker use the same `HF_EMBEDDING_MODEL`, defaulting to `sentence-transformers/all-MiniLM-L6-v2`.

### 6.2 Provider timeouts and safe degradation

**What changed**

Embedding requests have a four-second timeout. Search continues in lexical mode if query embedding or vector retrieval fails.

**Why it changed**

The project target is semantic search under five seconds. An unavailable external provider must not make the marketplace search unavailable.

**How it works**

Embedding calls use a configured timeout. The hybrid branch catches provider or Atlas errors and returns `mode: lexical-fallback`. Manual and CSV listing creation remain available even if a listing embedding cannot be generated; the missing vector can be populated later by the backfill process.

### 6.3 Worker integration

**What changed**

Valid CSV rows receive embeddings before batch persistence.

**Why it changed**

Semantic retrieval only works when imported inventory and manually created inventory both contain comparable vectors.

**How it works**

After validation and duplicate detection, the worker composes searchable text and generates an embedding. A pool of at most eight concurrent embedding operations is used per batch.

This improves efficiency because it is faster than processing records strictly one by one, while avoiding hundreds of simultaneous provider calls that could exhaust sockets, memory, or provider rate limits.

### 6.4 Manual listing integration

**What changed**

Dealer-created listings receive embeddings at creation. Changes to searchable listing fields trigger regeneration.

**Why it changed**

Only embedding CSV imports would create inconsistent search quality. Updated listings also require refreshed vectors or semantic ranking would use stale content.

**How it works**

Creation embeds the validated input. Updates recompute when title, make, model, year, location, description, or attributes change. If regeneration fails, the stale embedding is removed so an old semantic representation cannot incorrectly rank the updated listing.

### 6.5 Existing-listing backfill

**What changed**

A backfill script and npm command were added.

**Why it changed**

Schema changes do not automatically populate old documents. Without a migration, only newly created inventory would participate in vector search.

**How it works**

The command below processes every listing:

```sh
npm run search:backfill --workspace @motorx/backend -- --all
```

Without `--all`, it only processes listings with missing or empty embeddings. The script uses a cursor and batch size instead of loading the entire collection into memory.

## 7. Hybrid ranking

### 7.1 Structured pre-filtering

**What changed**

Semantic search is restricted using extracted structured conditions before relevance is calculated.

**Why it changed**

A semantically similar listing is still wrong if it violates a buyer’s hard constraints. For example, a manual petrol sedan should not outrank an automatic electric SUV when those properties were requested.

**How it works**

The vector stage receives exact and range-compatible filters. Full make, model, and location checks are applied before vector candidates enter the merged result set. Every result remains subject to `status: active`.

### 7.2 Combined relevance score

**What changed**

Search results can be ordered by a combined score rather than creation date alone.

**Why it changed**

Semantic similarity captures intent, while lexical matching rewards exact terms. Either signal alone has weaknesses.

**How it works**

The ranking score uses:

- 65% vector similarity.
- 35% lexical token/phrase matching.

Structured constraints are enforced as filters instead of weak scoring signals. This prevents a high semantic score from overriding a required price, year, or vehicle type.

### 7.3 Bounded candidate sets

**What changed**

Hybrid ranking considers at most 300 structured candidates and 200 vector candidates.

**Why it changed**

Application-side ranking of an unbounded collection would increase memory use and response time as inventory grows.

**How it works**

MongoDB returns capped candidate sets. The service merges them by listing ID, applies full filter checks, calculates scores, sorts, and then paginates. Structured and vector candidate requests run concurrently to reduce total wall-clock latency.

### 7.4 Database execution limits

**What changed**

Structured operations use a 1.8-second MongoDB execution limit; vector aggregation uses a 4.5-second limit.

**Why it changed**

These limits align database work with the Sprint 6 response-time goals and prevent a pathological query from occupying resources indefinitely.

**How it works**

Mongoose `maxTimeMS` is applied to listing queries, counts, and vector aggregation. A query exceeding the limit fails explicitly instead of silently degrading the whole API under load.

## 8. Database indexing and data model

### 8.1 Listing embedding field

**What changed**

Listings now support an optional numeric `embedding` array.

**Why it changed**

Atlas Vector Search requires the vector to be stored with the searchable document.

**How it works**

The Mongoose field uses `[Number]`, is optional, and is excluded from normal query projections through `select: false`. Buyers therefore do not download 384 floating-point values with every listing card.

### 8.2 Compound indexes

**What changed**

Indexes were added for the real marketplace filter patterns:

- Status, category, and price.
- Status, category, and year.
- Status, fuel type, and transmission.
- Status, body type, and condition.
- Status and mileage.
- Status and location.

**Why it changed**

Filtering without suitable indexes forces MongoDB to inspect more documents as inventory grows. Since every public query includes active status, leading indexes with status makes them align with actual access patterns.

**How it works**

Indexes are declared on the listing schema with stable names. Atlas vector index configuration is documented separately because it is managed by Atlas rather than ordinary Mongoose index creation.

## 9. Frontend search experience

### 9.1 Dedicated search API use

**What changed**

The marketplace uses `/search` when a `q` value exists and `/listings` for filter-only browsing.

**Why it changed**

Natural-language interpretation and relevance ranking should not add cost to ordinary browse requests.

**How it works**

The React Query hook selects the correct API method from filter state. Search requests default to relevance; browse requests retain newest-first behavior.

### 9.2 Debounced input

**What changed**

The smart-search input waits 350 milliseconds after typing stops before changing the query.

**Why it changed**

Sending a request for every keystroke wastes browser, network, backend, database, and embedding-provider capacity. It also causes visible result flicker.

**How it works**

A React effect starts a timer after input changes and cancels the previous timer during cleanup. React Query keeps the previous result set visible while the replacement request is being fetched.

### 9.3 URL-compatible search

**What changed**

Landing-page searches navigate to `/marketplace?q=...`, and the marketplace initializes itself from `q`. The previous `search` query parameter is still recognized for compatibility.

**Why it changed**

Searches should survive navigation and support direct links. Compatibility avoids breaking older links.

**How it works**

React Router reads and replaces the search parameter. Clearing all filters also clears the URL query.

### 9.4 User feedback states

**What changed**

The page provides:

- Initial loading status.
- Background “Updating…” status.
- Explicit error message and retry control.
- Result counts.
- Search-specific empty state and clear action.
- Relevance sorting when natural-language search is active.

**Why it changed**

Users need to distinguish “still loading,” “no matching inventory,” and “the system failed.” Treating all three as an empty grid makes the interface confusing.

**How it works**

React Query state drives mutually exclusive UI states. Live regions and alert roles expose asynchronous changes to assistive technology.

### 9.5 Accessibility

**What changed**

Search controls now include explicit labels or accessible names, pagination announces the current page, loading/error states have semantic roles, keyboard focus is visible, and reduced-motion preferences are honored.

**Why it changed**

Search is a core public workflow and must remain usable without a mouse, with a screen reader, or by users sensitive to animation.

**How it works**

The implementation uses `label`, `aria-label`, `aria-live`, `aria-current`, semantic `nav`, `role=status`, `role=alert`, `:focus-visible`, and `prefers-reduced-motion` CSS.

### 9.6 Responsive layout

**What changed**

The filter/results layout, result toolbar, range inputs, and error controls adapt to tablet and mobile widths.

**Why it changed**

Fixed-width sidebars and toolbars can overflow or become difficult to operate on small screens.

**How it works**

CSS switches the desktop row layout to a column, uses `minmax(0, 1fr)` for range inputs, prevents result-grid overflow, and stacks controls at narrow breakpoints.

## 10. Frontend delivery efficiency

### 10.1 Route-level code splitting

**What changed**

Authentication, buyer, dealer, and admin screens are loaded through `React.lazy` and `Suspense`.

**Why it changed**

Marketplace buyers should not download dealer upload forms and admin dashboards before they are needed. The first production build reported a 648.69 kB JavaScript entry chunk.

**How it works**

Each route screen is emitted as a separate Vite chunk and loaded on navigation. A small accessible loading indicator is rendered while a route chunk downloads.

### 10.2 Vendor chunking

**What changed**

React, Firebase, React Query, and Axios are emitted as stable vendor chunks.

**Why it changed**

Large third-party libraries change less frequently than application code. Separating them improves browser caching and removed the Vite oversized-chunk warning.

**How it works**

Vite/Rollup `manualChunks` groups dependencies by package. The final build produced:

- Main application chunk: approximately 74.37 kB, 19.46 kB gzip.
- Marketplace route: approximately 10.55 kB, 2.96 kB gzip.
- Separate React, Firebase, Query, and HTTP vendor chunks.

This is a substantial improvement over the original 648.69 kB single entry bundle.

## 11. Security, reliability, and maintainability

### 11.1 Regex safety

**What changed**

All user-provided text is escaped before constructing MongoDB regular expressions.

**Why it changed**

Raw regex syntax could alter matching behavior or create expensive patterns.

**How it works**

`escapeSearchRegex` treats special characters as literal input. Query length limits provide another bound.

### 11.2 Public-data boundary

**What changed**

Every search path centrally enforces active-listing status.

**Why it changed**

Draft, sold, or archived dealer inventory must not appear in buyer search, regardless of whether the request is structured, fuzzy, semantic, or fallback.

**How it works**

Both ordinary and vector filter builders start with `status: active`; full candidate checks run again before ranking vector candidates.

### 11.3 Graceful semantic fallback

**What changed**

Semantic search is an enhancement rather than a single point of failure.

**Why it changed**

Atlas Vector Search may be unavailable in local MongoDB, and hosted embedding services can time out or rate-limit requests.

**How it works**

The service catches semantic-path errors and uses lexical ranking. The response reports the actual mode so operations teams can monitor degradation.

### 11.4 Configuration validation

**What changed**

Embedding model, timeout, and Atlas index name are typed environment settings with defaults.

**Why it changed**

Hardcoded infrastructure names make deployment changes risky, while unvalidated numeric settings can cause unexpected behavior.

**How it works**

Backend and worker Zod environment schemas parse the values at startup. Example environment files document every setting.

### 11.5 Maintainable API contract

**What changed**

The API documentation now describes `/search`, accepted filters, response metadata, modes, and bounds.

**Why it changed**

Frontend, backend, testing, and deployment work need one explicit integration contract.

**How it works**

The endpoint returns the standard MotorX success envelope containing listings, pagination, and search metadata including query interpretation, corrections, mode, and duration.

## 12. Testing and verification

### 12.1 Automated tests added

**What changed**

Tests now cover:

- The SRS-style natural-language example.
- Make/model typo correction.
- Mileage-versus-price interpretation.
- Year extraction.
- Query length and pagination bounds.
- Location/mileage parsing.
- Inverted range rejection.
- 384-dimensional normalized embedding behavior.
- Provider matrix normalization.

**Why it changed**

Search parsing contains interacting rules where a small ordering change can silently alter results. Tests protect the agreed interpretation.

**How it works**

Vitest executes deterministic unit tests without requiring the embedding provider or Atlas.

### 12.2 Verification results

| Check | Result |
|---|---|
| Shared-contract TypeScript build | Passed |
| Backend TypeScript build | Passed |
| Worker TypeScript build | Passed |
| Frontend TypeScript and production Vite build | Passed |
| Search and listing validation tests | 17 passed |
| Backfill script syntax check | Passed |
| Git whitespace/error check | Passed |
| Full backend test attempt | 32 tests passed; three existing repository suites could not connect to MongoDB at `127.0.0.1:27017` |

The MongoDB failure was environmental rather than a failed assertion. Those database-backed suites must be rerun with the test database available.

## 13. Operational work required before production activation

The implementation is complete in source code, but production semantic retrieval depends on infrastructure configuration.

### 13.1 Create the Atlas Vector Search index

Follow `docs/search-operations.md` to create `listing_embedding_index` with:

- 384 dimensions.
- Cosine similarity.
- `embedding` as the vector field.
- Filter mappings for status, category, price, year, mileage, fuel, transmission, body type, and condition.

### 13.2 Configure environment values

Set:

```text
HF_API_KEY=<production key, if hosted embeddings are required>
HF_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_TIMEOUT_MS=4000
ATLAS_VECTOR_INDEX=listing_embedding_index
```

### 13.3 Backfill existing inventory

Run:

```sh
npm run search:backfill --workspace @motorx/backend -- --all
```

This is mandatory when first enabling semantic search or changing models.

### 13.4 Production measurements

The code introduces bounds and timeouts, but performance targets must be proven against production-like data and infrastructure. Monitor:

- Structured search p50/p95/p99 latency.
- Semantic search p50/p95/p99 latency.
- Atlas vector aggregation time.
- Embedding-provider latency and error rate.
- Percentage of requests using `lexical-fallback`.
- Zero-result rate by interpreted filter.
- Search endpoint request volume and HTTP error rate.
- Frontend Core Web Vitals and route-chunk download time.

Recommended acceptance targets from the project plan are structured search below two seconds, semantic search below five seconds, and 95% of API calls below two seconds where semantic provider work is not required.

## 14. Efficiency improvements summary

| Efficiency action | Why it improves the system | Implementation mechanism |
|---|---|---|
| Debounced input | Reduces duplicate API, database, and provider calls | 350 ms cancellable timer |
| Central filter builder | Prevents duplicate logic and maintenance effort | Shared search repository function |
| Compound indexes | Reduces document scans | Indexes matching active marketplace access patterns |
| Structured pre-filtering | Avoids scoring irrelevant vectors | Atlas filter plus full candidate verification |
| Bounded candidate pools | Caps memory and ranking CPU | 300 structured and 200 vector candidates |
| Concurrent retrieval | Reduces hybrid wall-clock latency | Structured and vector promises run together |
| Database time limits | Prevents runaway operations | 1.8-second structured and 4.5-second vector `maxTimeMS` |
| Provider timeout | Protects the five-second semantic target | Four-second abort/timeout |
| Embedding concurrency pool | Balances throughput and provider pressure | Maximum eight rows at once |
| Hidden embedding projection | Reduces API payload and serialization cost | Mongoose `select: false` |
| Previous-result retention | Reduces UI flicker and perceived wait | React Query placeholder data |
| Route lazy loading | Avoids downloading unused portals | Dynamic imports and `Suspense` |
| Vendor chunking | Improves caching and removes oversized bundle | Vite manual chunks |
| Cursor-based backfill | Avoids loading the collection into memory | MongoDB cursor with batch size 50 |
| Semantic fallback | Maintains search availability | Lexical ranking when provider/vector search fails |

## 15. Files affected

### Backend

- `apps/backend/src/modules/search/*`
- `apps/backend/src/modules/marketplace/listing.model.ts`
- `apps/backend/src/modules/marketplace/listing.validation.ts`
- `apps/backend/src/modules/marketplace/listing.service.ts`
- `apps/backend/src/modules/marketplace/listing.repository.ts`
- `apps/backend/src/modules/buyers/buyer.repository.ts`
- `apps/backend/src/app.ts`
- `apps/backend/src/config/env.ts`
- `apps/backend/scripts/backfill-search-embeddings.mjs`

### Worker and shared contracts

- `apps/worker/src/pipeline/generateEmbedding.ts`
- `apps/worker/src/pipeline/persist.ts`
- `apps/worker/src/repositories/listing.repository.ts`
- `apps/worker/src/config/env.ts`
- `packages/shared-contracts/src/search/embedding.ts`

### Frontend

- `apps/frontend/src/portals/buyer/pages/Marketplace.tsx`
- `apps/frontend/src/features/buyers/hooks/useBuyerListings.ts`
- `apps/frontend/src/features/buyers/services/buyerApi.ts`
- `apps/frontend/src/features/listings/types/listing.types.ts`
- `apps/frontend/src/app/LandingPage.tsx`
- `apps/frontend/src/app/App.tsx`
- `apps/frontend/src/index.css`
- `apps/frontend/vite.config.ts`

### Configuration and documentation

- `.env.example`
- `apps/backend/.env.example`
- `docs/api-contract.md`
- `docs/search-operations.md`
- `README.md`

## 16. Conclusion

The search work was not limited to adding another endpoint. It reorganized retrieval around a dedicated module, completed structured filtering, added deterministic natural-language interpretation and typo correction, integrated consistent embeddings into both inventory entry paths, introduced bounded hybrid ranking, and improved the buyer experience and frontend delivery performance.

The main efficiency gains come from fewer requests, indexed filters, bounded and concurrent retrieval, controlled provider concurrency, strict execution time limits, smaller application chunks, and graceful fallback. The result is a search subsystem designed to remain understandable, testable, and operational as MotorX inventory grows.
