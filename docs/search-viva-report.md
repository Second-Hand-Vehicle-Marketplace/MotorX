# MotorX Search Feature — Complete Viva Report

## 1. What to say first

### 30-second answer

MotorX has two related buyer-search paths. `GET /api/v1/listings` handles ordinary filter-based browsing, while `GET /api/v1/search?q=...` handles natural-language search. The intelligent path validates the request, extracts hard constraints such as make, body type, price, mileage, year, fuel, transmission, condition, and location, corrects bounded make/model spelling mistakes, and then chooses structured or hybrid retrieval. Hybrid retrieval combines MongoDB Atlas vector similarity at 65% with lexical matching at 35%. If the embedding provider or Atlas Vector Search is unavailable, it safely falls back to bounded lexical ranking. Only active listings can be returned.

### Two-minute answer

The feature is a complete subsystem, not only a text box. On the frontend, a buyer can search from the landing page or marketplace, use everyday language, combine that query with explicit filters, sort and paginate results, and receive loading, updating, error, empty, and retry states. The query is kept in the URL and marketplace typing is debounced by 350 ms.

On the backend, Express exposes a public validated `/api/v1/search` route. A deterministic rule-based analyzer separates a query into structured filters and residual intent. For a fully structured query such as “automatic SUV under 2 million near Colombo,” MongoDB executes an indexed filter directly. If meaningful intent remains and relevance sorting is selected, the service concurrently obtains up to 300 structured candidates and up to 200 Atlas vector candidates. It merges by listing ID, enforces all filters, calculates `0.65 × semantic score + 0.35 × lexical score`, sorts, and paginates the bounded set.

Listings receive the same 384-dimensional embedding contract whether they are created manually, imported through the CSV worker, updated, or backfilled. Embeddings are excluded from normal API results. Provider and database timeouts, request limits, escaped regex input, active-status enforcement, bounded pools, and lexical fallback make the public feature safer and more predictable.

## 2. The problem this feature solves

A basic keyword search requires the buyer to know exactly how a dealer wrote the listing. A filter-only UI also makes the buyer manually translate an intention into many fields. MotorX supports both approaches:

- Precise browse filters for buyers who know what they want.
- Natural-language interpretation for queries such as “used hybrid SUV near Kandy under 8 million.”
- Typo tolerance for known makes and models, for example `toyata corola`.
- Semantic retrieval for meaning that is not captured by an exact field.
- Lexical matching so exact words still matter.
- Graceful degradation when optional semantic infrastructure fails.

The implementation covers the structured-search requirements, natural-language requirements, fuzzy matching, embeddings, vector retrieval, hybrid ranking, and the associated ETL work described by FR-SEARCH-01–20 and FR-ETL-27–30 in the project planning documents.

## 3. Practical user experience

### 3.1 Entry points

There are two public entry points:

1. The landing-page hero search. Submitting text navigates to `/marketplace?q=<encoded query>`.
2. The marketplace “Smart Search” field. It initializes from `q`, and also recognizes the older `search` URL parameter for compatibility.

No login is required to browse or search. This is intentional because marketplace discovery is a public buyer workflow.

### 3.2 Available marketplace controls

The marketplace supports:

- Smart/natural-language query.
- Location.
- Vehicle category.
- Make.
- Fuel type.
- Transmission.
- Condition.
- Body type when the selected category is `car`.
- Minimum and maximum year.
- Minimum and maximum price in LKR.
- Minimum and maximum mileage in kilometres.
- Relevance, newest, price ascending, price descending, newest year, and lowest-mileage sorting.
- Pagination and reset-all behavior.

Natural language and sidebar filters can be combined. Explicit sidebar/API values are spread after analyzer-derived filters, so an explicit value wins if the same field is also inferred from `q`.

### 3.3 UI feedback

The buyer sees distinct states:

- An initial loading spinner.
- The previous results plus “Updating…” during a background refresh.
- A result count.
- A retryable error panel.
- A no-results panel with a clear-filters action.
- Previous/next and numbered pagination controls.

This matters in a viva: “loading,” “zero matches,” and “request failure” are different system states and must not be represented by the same blank screen.

### 3.4 Accessibility and responsive behavior

Inputs have visible labels or accessible names. Loading uses `role="status"`; failures use `role="alert"`; result counts use `aria-live`; the current page uses `aria-current="page"`; pagination is a semantic `nav`. Global `:focus-visible` styling supports keyboard users, and `prefers-reduced-motion` reduces animations. At tablet width the sidebar stacks above results, and at small mobile widths toolbars and error actions stack vertically.

## 4. High-level architecture

```text
Landing page / Marketplace
          |
          | q exists                         no q
          v                                  v
GET /api/v1/search                    GET /api/v1/listings
          |                                  |
          v                                  |
Zod request validation                       |
          |                                  |
          v                                  |
Rule-based query analyzer                     |
          |                                  |
          +----------+-----------------------+
                     v
              shared filter builder
                     |
        +------------+-------------+
        |                          |
 structured query             relevance query
        |                          |
 MongoDB find + count      structured candidates || query embedding
                                   |              + Atlas vector search
                                   +------ merge, score, sort
                                                  |
                                                  v
                                  standard response + pagination + metadata
```

The backend is a modular monolith. The `search` module owns retrieval logic; the `buyers` module owns the public browsing use case and delegates its listing collection query to the search repository. This prevents the browse and smart-search filters from drifting apart.

## 5. Frontend implementation in detail

### 5.1 API selection

`useBuyerListings` holds `filters` and `page` state. Its React Query function chooses:

```text
filters.q is truthy  -> buyerApi.searchVehicles() -> /search
filters.q is absent  -> buyerApi.listVehicles()   -> /listings
```

The React Query cache key is `['buyer-listings', filters, page, pageSize]`. Therefore a filter, page, or page-size change identifies a different cached request. `placeholderData: previous => previous` retains the old cards during refetching.

`updateFilters` merges partial changes and always returns to page 1. `resetFilters` clears all filters and also returns to page 1.

### 5.2 Debouncing

The smart-search input has local `searchInput` state. A React effect starts a 350 ms timer. Every new keystroke cleans up the old timer, so only the settled input updates `filters.q` and triggers React Query.

This reduces requests to the frontend API, MongoDB, Atlas, and possibly Hugging Face. Sidebar filters are not debounced; they update immediately.

### 5.3 URL behavior

After the debounce, non-empty text replaces the current URL query with `?q=...`. Empty text replaces it with no query string. Landing-page submission performs the same transition immediately. URL encoding is applied on landing-page navigation.

Only `q` is persisted in the URL. Sidebar filters, sorting, and page are currently component state, so a copied URL does not reproduce those values.

### 5.4 API mapping

The frontend Axios client uses the configured API base URL. It attaches a Firebase token if a user happens to be signed in, although public search does not require it. `buyerApi` converts shared `ListingDto` objects into the UI `Listing` model, including ordered image information.

The backend returns search metadata, but the marketplace currently consumes only listings and pagination. Search mode, interpreted filters, corrections, and duration are visible through the network response but are not shown in the UI.

### 5.5 Frontend delivery performance

Buyer, authentication, dealer, and admin pages are route-lazy-loaded with `React.lazy` and `Suspense`. Vite separates React, Firebase, React Query, and Axios into stable vendor chunks. The verified production build emitted the marketplace route at 10.55 kB (2.96 kB gzip) and the main application chunk at 74.37 kB (19.46 kB gzip).

## 6. Public API contract

### 6.1 Browse endpoint

```http
GET /api/v1/listings
```

This is used when there is no natural-language `q`. It supports page, limit, legacy keyword `search`, make, model, location, category, body type, condition, fuel, transmission, year range, price range, mileage range, and non-relevance sorting. Its page-size maximum is 100.

### 6.2 Intelligent-search endpoint

```http
GET /api/v1/search?q=automatic%20SUV%20under%208m%20near%20Colombo
```

`q` is mandatory and trimmed. It must contain 1–200 characters. The default page is 1, default limit is 20, maximum limit is 50, and the default sort is `relevance`.

Accepted parameters:

| Parameter | Rules / meaning |
|---|---|
| `q` | Required natural-language text, 1–200 characters |
| `page` | Positive integer, default 1 |
| `limit` | 1–50, default 20 |
| `make`, `model` | Optional, maximum 80 characters |
| `location` | Optional, 2–120 characters |
| `yearMin`, `yearMax` | Integer, minimum 1900 |
| `priceMin`, `priceMax` | Non-negative number |
| `mileageMin`, `mileageMax` | Non-negative number |
| `category` | Shared vehicle-category enum |
| `bodyType` | Shared car-body-type enum |
| `condition` | Shared condition enum |
| `fuelType` | Shared fuel enum |
| `transmission` | Shared transmission enum |
| `sortBy` | `relevance`, `newest`, `price-asc`, `price-desc`, `year-desc`, or `mileage-asc` |

For all three numeric ranges, the maximum must be greater than or equal to the minimum. Zod rejects invalid input before analysis or database work.

### 6.3 Success response shape

```json
{
  "success": true,
  "data": {
    "listings": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    },
    "search": {
      "query": "toyata corola automatic",
      "interpreted": {
        "make": "Toyota",
        "model": "Corolla",
        "transmission": "automatic"
      },
      "correctedTerms": {
        "toyata": "toyota",
        "corola": "corolla"
      },
      "mode": "structured",
      "durationMs": 12
    }
  },
  "meta": null
}
```

The standard error envelope is `{ success: false, error: { code, message, fields? }, meta: null }`. Invalid query parameters return HTTP 400. Unexpected database/service errors return the generic HTTP 500 envelope rather than leaking internal details.

## 7. Natural-language analyzer

### 7.1 Why it is rule-based

The analyzer uses deterministic Node/TypeScript rules rather than asking a generative model to interpret every query. This makes extraction fast, testable, inexpensive, and predictable. Semantic embeddings are used for retrieval intent, not for deciding hard constraints.

### 7.2 Processing sequence

Rule order is important:

1. Lowercase the query using the English locale.
2. Replace unsupported punctuation with spaces and normalize whitespace.
3. Extract mileage expressions before prices.
4. Extract maximum and minimum prices.
5. Extract year ranges or an exact year.
6. Extract location.
7. Extract category/body type, transmission, fuel, and condition mappings.
8. Correct/detect known makes and models.
9. Remove stop words and return the remaining tokens as `intent`.

Mileage must be processed before price because both can begin with “under” or “over.” The `km` suffix is the disambiguating signal.

### 7.3 Numeric expressions

`numericAmount` removes commas and supports:

- `2 million` or `2m` → 2,000,000.
- `20 lakh` / `20 lakhs` → 2,000,000.
- `500k` → 500,000.
- Plain numbers → unchanged numeric value.

Recognized maximum prefixes include `under`, `below`, `less than`, and `maximum`. Minimum prefixes include `over`, `above`, `more than`, and `minimum`. Currency markers such as LKR, Rs, and rupees are accepted for prices.

### 7.4 Years and location

`after 2019`, `from 2019`, or `newer than 2019` sets `yearMin=2019`. `before 2019` or `older than 2019` sets `yearMax=2019`. A standalone four-digit 19xx/20xx year sets both limits, producing an exact year.

Location is detected after `near`, `around`, `located in`, or `in`, and continues until the end or another recognized constraint word. The analyzer title-cases the extracted value; actual database matching remains case-insensitive.

### 7.5 Vocabulary mappings

Examples include:

| Buyer text | Stored filter |
|---|---|
| SUV / sport utility | `category=car`, `bodyType=suv` |
| hatchback / sedan | `category=car` plus matching body type |
| bike / motorcycle / motorbike | `category=motorcycle` |
| three-wheeler / tuk-tuk | `category=three_wheeler` |
| van / truck / bus | Matching top-level category |
| automatic / manual / CVT / DCT | Matching transmission enum |
| petrol / diesel / hybrid / plug-in hybrid / electric / EV | Matching fuel enum |
| brand new / new / used / second-hand / reconditioned | Matching condition enum |

Plug-in hybrid is tested before ordinary hybrid so the more specific phrase wins.

### 7.6 Residual intent

Tokens not consumed as hard constraints are retained as semantic/lexical intent after stop words are removed. Stop words include general request words such as `show`, `find`, `looking`, `vehicle`, and `please`, plus vague words such as `affordable`, `cheap`, and `reliable`.

“Affordable” by itself does not create a numeric price. The system only creates a price constraint when the buyer gives an amount. This avoids inventing a budget.

Example:

```text
Input:  reliable Toyota family car near Colombo
Output filters: make=Toyota, location=Colombo
Residual intent: family
```

## 8. Fuzzy make/model matching

The analyzer contains a controlled vocabulary of common makes and models. Exact vocabulary detection is attempted first. Otherwise, eligible tokens of at least four characters are compared using Levenshtein edit distance.

Levenshtein distance is the minimum number of single-character insertions, deletions, and substitutions needed to change one word into another. The implementation uses a dynamic-programming row, so its memory cost is proportional to the comparison word length rather than a full matrix.

Acceptance thresholds are deliberately small:

- Tokens with 4–6 characters: maximum distance 1.
- Tokens with 7 or more characters: maximum distance 2.
- Tokens shorter than 4: no fuzzy correction.

This reduces false corrections. The closest accepted correction is recorded in `correctedTerms`, while the corrected make/model becomes a structured filter.

Current vocabularies are finite. A valid make or model that is not listed is left as intent rather than automatically treated as a structured make/model. This is safe but means the lists need maintenance or replacement with a data-driven vocabulary as inventory expands.

## 9. Search-mode decision logic

| Condition | Mode | What happens |
|---|---|---|
| No `q` in frontend state | Browse, not a search mode | Frontend calls `/listings` |
| Non-relevance sort selected | `structured` | Direct filtered MongoDB query |
| Analyzer leaves no residual intent | `structured` | Extracted filters fully represent the query |
| Residual intent + relevance sort + semantic path succeeds | `hybrid` | Merge structured and vector candidates, then combined ranking |
| Residual intent + relevance sort + embedding/Atlas failure | `lexical-fallback` | Rank the bounded structured candidates lexically |

Example outcomes:

- `Toyota` → detected make, no residual intent → structured.
- `toyata corola automatic` → corrected make/model plus transmission, no residual intent → structured.
- `automatic SUV under 2 million near Colombo` → all terms become filters/stop words → structured.
- `Toyota family vehicle` → make filter plus residual `family` → hybrid when available.
- `comfortable long-distance vehicle` → residual intent → hybrid when available.

If the caller requests `newest` or another non-relevance sort, that explicit ordering takes priority over hybrid relevance.

## 10. Structured filter construction

`buildListingFilter` is reused by browse and intelligent search. It always starts with:

```js
{ status: 'active' }
```

This is the public-data boundary: draft, pending, sold, rejected, and archived inventory cannot appear.

Matching behavior:

- Make: case-insensitive exact match using anchored regex.
- Model: case-insensitive substring match.
- Location: case-insensitive substring match.
- Category and categorical attributes: exact match.
- Year, price, mileage: MongoDB `$gte`/`$lte` ranges.
- Legacy keyword search: case-insensitive substring across title, make, model, description, and location.

All user text is escaped with `escapeSearchRegex` before a `RegExp` is created. A query such as `.*` is therefore searched literally and cannot inject its own regular-expression behavior.

Structured retrieval executes the page query and total count concurrently. It uses `skip`/`limit`, deterministic secondary `_id` sorting, and `maxTimeMS(1800)`.

## 11. Embeddings

### 11.1 What an embedding is

An embedding is a numeric vector representing text. Similar text should point in similar directions in vector space. Atlas compares query and listing vectors using cosine similarity.

MotorX uses 384 values per vector. Both query and listing vectors must come from the same embedding process; equal dimensions alone are not enough.

### 11.2 Searchable listing text

`composeListingSearchText` joins:

- Title.
- Make.
- Model.
- Year.
- Category.
- Location.
- Description.
- Every string or numeric value in the category-specific `attributes` object.

Falsy values are omitted. The same shared function is used for creation, CSV import, update, backfill, and lexical scoring, reducing representation drift.

### 11.3 Hosted embedding path

With `HF_API_KEY`, backend and worker call the Hugging Face feature-extraction endpoint using `HF_EMBEDDING_MODEL`, defaulting to `sentence-transformers/all-MiniLM-L6-v2`. Input is trimmed and capped at 5,000 characters. Normal embedding calls time out after the configured value, default 4,000 ms.

The provider may return one vector or one vector per token. `normalizeEmbeddingResponse` accepts both. For a token matrix, it mean-pools each dimension. It then L2-normalizes the result. Any empty, mixed, inconsistent, unsupported, or non-384-dimensional response is rejected.

### 11.4 Local fallback embedding

Without `HF_API_KEY`, a deterministic local feature-hashing function tokenizes the text, hashes each token into one of 384 dimensions with a signed contribution, and L2-normalizes the result. This is offline and deterministic and provides useful lexical-like vector behavior for development.

It is not the same vector space as MiniLM. Therefore:

- Backend query generation, worker ingestion, manual creation, and backfill must use the same mode.
- Do not query locally generated listing vectors with hosted MiniLM vectors, or vice versa.
- When switching provider/model/mode, run a full `--all` backfill before relying on semantic results.

This is a particularly strong viva answer: vector compatibility requires the same model/process, not merely 384 numbers.

## 12. How listing embeddings stay up to date

### 12.1 Manual creation

Dealer listing creation attempts to generate an embedding before persistence. If generation fails, creation continues without an embedding. Search availability is prioritized over making an external AI service a write-path dependency.

### 12.2 Manual update

Changes to title, make, model, year, location, description, or attributes trigger regeneration. If regeneration fails, the old embedding is explicitly unset. Removing a stale vector is safer than semantically ranking an updated listing using its previous content.

### 12.3 CSV worker

After rows have been extracted, normalized, duplicate-checked, and validated, the persistence stage composes text and generates embeddings. It runs a pool of at most eight embedding tasks for the current row array, preserving original row order in `enrichedRows`. A failed row embedding becomes `undefined`; it does not reject the otherwise valid vehicle.

With the default BullMQ worker concurrency of two, deployment-level hosted calls could reach roughly 16 concurrent embedding requests across two simultaneous jobs, subject to batch state and provider timing.

### 12.4 Backfill

The backend command is:

```powershell
npm.cmd run search:backfill --workspace @motorx/backend -- --all
```

Without `--all`, only documents with a missing or empty embedding are processed. The script reads with a cursor and batch size 50, updates each document, logs every 50 records, and disconnects in `finally`. Its provider timeout is eight seconds rather than the normal four seconds because it is an offline maintenance operation.

The script is not an atomic migration. If it stops halfway, already updated documents remain updated; rerunning missing-only or `--all` continues/rebuilds as appropriate.

## 13. Atlas Vector Search

The vector index is external Atlas infrastructure, not an ordinary Mongoose index. The intended index name is `listing_embedding_index`, configurable through `ATLAS_VECTOR_INDEX`.

Required vector definition:

```json
{ "type": "vector", "path": "embedding", "numDimensions": 384, "similarity": "cosine" }
```

Filter fields include status, category, price, year, mileage, fuel, transmission, body type, and condition. Make, model, and location are not Atlas prefilters in the current index definition because their application matching is case-insensitive/substring based. Vector candidates are post-checked against those full conditions before merging.

`$vectorSearch` requests up to 1,000 preliminary candidates (`200 × 5`) and returns at most 200. Atlas adds `vectorScore` using `$meta: 'vectorSearchScore'`, and the pipeline projects the raw embedding out. The aggregation has `maxTimeMS(4500)`.

Local Community MongoDB does not implement `$vectorSearch`. This is expected: the caught aggregation error produces lexical fallback rather than failing the endpoint.

## 14. Hybrid retrieval and ranking

### 14.1 Concurrent candidate retrieval

The service starts two independent operations together:

- Up to 300 newest documents satisfying structured filters, plus a count.
- Query embedding followed by up to 200 Atlas vector results.

`Promise.all` waits for both, so normal wall-clock time is closer to the slower branch rather than their sum.

### 14.2 Merge and post-filter

Candidates are stored in a `Map` keyed by stringified MongoDB `_id`, removing duplicates. Structured candidates enter first. Vector candidates enter only after full make, model, location, category, attribute, and numeric-range checks. Atlas itself already requires active status.

### 14.3 Lexical score

The raw query is lowercased and tokenized to ASCII letters/numbers. The listing’s composed search text is lowercased. The score is:

```text
matched query token count / total query token count
+ 0.2 if the complete query phrase appears
capped at 1.0
```

This score is simple, deterministic, and bounded. It does not use term frequency, inverse document frequency, stemming, synonyms, or field-specific weights.

### 14.4 Final score

```text
final relevance = 0.65 × Atlas vector score + 0.35 × lexical score
```

If a document came only from the structured pool, its semantic score is zero. Ties are broken by descending string form of `_id`, giving stable output for the same candidate set.

Hard conditions are filters, not score bonuses. A highly similar vehicle cannot override the buyer’s maximum price or requested transmission.

### 14.5 Pagination semantics

The combined list is sorted first, then array-sliced using `(page - 1) × limit`. Because ranking is deliberately bounded, intelligent-search pagination describes the bounded ranked pool, not necessarily every matching document in a very large collection. Browse/structured mode uses a normal database count across all matches.

## 15. Database design and performance

### 15.1 Embedding field

The listing schema stores `embedding` as an optional number array with `select: false`. Normal Mongoose queries and API serialization therefore do not send 384 floats with every result card. The vector aggregation also explicitly projects it out.

### 15.2 Relevant ordinary indexes

The schema declares:

- `{ status, publishedAt, _id }` for active newest browsing.
- `{ make, model, year }`.
- `{ category, status }`.
- `{ status, category, price }`.
- `{ status, category, year }`.
- `{ status, attributes.fuelType, attributes.transmission }`.
- `{ status, attributes.bodyType, attributes.condition }`.
- `{ status, attributes.mileageKm }`.
- `{ status, location }`.

These reflect real access patterns and put the public status boundary into the common indexes. The separate Atlas vector index must still be provisioned manually.

Case-insensitive substring regexes may not obtain the full benefit of ordinary B-tree indexes, especially when unanchored. For larger datasets, normalized lowercase fields, Atlas Search text indexes, autocomplete indexes, or collation-aware exact fields would be stronger choices.

### 15.3 Bounded resource use

- Search query: maximum 200 characters.
- Search page size: maximum 50.
- Structured candidate pool: maximum 300.
- Vector return pool: maximum 200.
- Atlas preliminary candidates: maximum 1,000.
- Structured MongoDB time limit: 1.8 seconds.
- Atlas aggregation time limit: 4.5 seconds.
- Normal embedding timeout: 4 seconds by default.
- Listing embedding input: maximum 5,000 characters.
- CSV embedding pool: maximum eight tasks per active worker job.

## 16. Security, privacy, and reliability

### 16.1 Security controls

- Zod validates and coerces all accepted search parameters.
- Inverted ranges are rejected.
- Regex metacharacters are escaped.
- Search text and pagination are bounded.
- Express disables `x-powered-by` and uses Helmet and configured CORS globally.
- Search is read-only and intentionally public.
- Every database path enforces `status=active`.
- Embeddings never contain authentication data and are hidden from normal API output.

Search content still contains listing descriptions and attributes. Those are public listing fields, so dealers must not place private data in them.

### 16.2 Failure behavior

| Failure | Behavior |
|---|---|
| Invalid query/range | HTTP 400 before service/database work |
| Hugging Face timeout/error during search | `lexical-fallback` |
| Missing/invalid Atlas vector index | `lexical-fallback` |
| Local MongoDB lacks `$vectorSearch` | `lexical-fallback` |
| Embedding failure during create/import | Listing persists without vector |
| Embedding failure during searchable update | Stale vector is removed |
| Structured MongoDB query fails/times out | Endpoint returns an error; this is not caught as semantic fallback |
| Frontend request fails | Error panel with Try Again |

The important distinction is that only the optional semantic branch is degraded. A failure of the essential structured database path should be reported rather than hidden.

## 17. Verified tests and build status

The following checks were run against the current workspace on 22 August 2026:

| Check | Result |
|---|---|
| Search analyzer + listing validation suites | 17/17 tests passed |
| Shared-contract TypeScript build | Passed |
| Backend TypeScript build | Passed |
| Worker TypeScript build | Passed |
| Frontend TypeScript + Vite production build | Passed |
| Frontend transformed modules | 230 |
| Marketplace route bundle | 10.55 kB / 2.96 kB gzip |

Covered automated behavior includes the SRS-style query, typo correction, mileage-versus-price ordering, year range extraction, default pagination/sort, empty/oversized query rejection, maximum page-size rejection, inverted listing ranges, and normalized embedding response behavior.

The focused tests are unit/validation tests. There is currently no dedicated automated integration suite proving the complete `/search` service against an Atlas test index, no frontend component/E2E search test, and no relevance-quality benchmark dataset. Those are appropriate next tests.

## 18. Practical viva demonstration

### 18.1 Preparation

1. Start MongoDB/Redis/backend/frontend/worker using the project’s normal development setup.
2. Ensure several listings are `active`; draft/sold/archived records should exist for the security demonstration.
3. For a real `hybrid` demonstration, use Atlas, create the documented vector index, configure the same embedding mode in backend and worker, and backfill existing listings.
4. Without Atlas, explain that `lexical-fallback` is the correct designed behavior.

### 18.2 UI demo sequence

1. On the landing page, enter `automatic SUV under 8m near Colombo`.
2. Show navigation to `/marketplace?q=...`.
3. Explain the 350 ms debounce while editing the query.
4. Show the inferred result constraints and combine them with a sidebar filter.
5. Change sort order and explain why non-relevance sorting uses structured mode.
6. Enter `toyata corola automatic`; inspect the network response to show `correctedTerms`.
7. Enter an impossible combination to show the empty state, then clear filters.
8. Stop Atlas or use local MongoDB and show that the request still succeeds with `mode=lexical-fallback`.
9. Attempt to search for a known sold/draft listing and show that it is absent.

### 18.3 PowerShell API examples

```powershell
Invoke-RestMethod "http://localhost:3000/api/v1/search?q=toyata%20corola%20automatic"

Invoke-RestMethod "http://localhost:3000/api/v1/search?q=family%20Toyota&priceMax=8000000&location=Colombo&limit=9"

Invoke-RestMethod "http://localhost:3000/api/v1/listings?category=car&fuelType=hybrid&sortBy=price-asc"
```

For a validation demonstration, request `priceMin=8000000&priceMax=2000000` and explain why the route rejects it before database execution.

### 18.4 What to inspect in browser developer tools

- Request switches between `/listings` and `/search` depending on `q`.
- Query parameters match UI state.
- Search response includes interpreted filters, corrections, mode, and duration.
- No `embedding` array is present in listing JSON.
- Rapid typing produces one settled request rather than one request per key.

## 19. Limitations you should state honestly

These are current design boundaries, not reasons to hide the implementation:

1. Hybrid search ranks only bounded pools (300 structured, 200 vector), so it is approximate at very large scale and its `total` is bounded.
2. There is no minimum relevance threshold. In lexical fallback, zero-score candidates can remain in the bounded results when no terms match.
3. The fallback candidate query retrieves newest structured matches rather than a database lexical match. It is availability-oriented, not a full-text-search replacement.
4. Selecting a non-relevance sort bypasses hybrid ranking. When a query contains both extracted filters and residual intent, the residual text is not applied in that structured branch.
5. The fixed make/model vocabulary will miss new brands and models until updated.
6. “Affordable,” “reliable,” and similar vague words are stop words; they do not create business-defined constraints.
7. Language rules are English-oriented and ASCII-token based. Sinhala, Tamil, transliteration, stemming, and multilingual synonyms are not implemented.
8. Location, model, and legacy keyword matching use unanchored case-insensitive regexes, which can become expensive at scale.
9. Sidebar filters and page are not encoded in the URL.
10. The UI does not yet display spelling corrections, interpreted constraints, search mode, or duration even though the API returns them.
11. Local hashed vectors and hosted model vectors are incompatible vector spaces; deployments must not mix them.
12. A model/version change is not stored per listing. Operational discipline and a full backfill are required.
13. The worker catches embedding failures without structured logging/metrics at that point, so failure visibility depends on future observability work.
14. There is no result-personalization, popularity signal, click feedback loop, synonym dictionary, or learned-to-rank system.
15. Relevance weights (65/35) are design constants, not yet calibrated using judged search data or A/B testing.

Mentioning these shows engineering maturity. A strong system description explains both guarantees and boundaries.

## 20. Recommended improvements

### Highest priority

1. Add service/repository integration tests using an Atlas test database or a controlled vector-search abstraction.
2. Add frontend component/E2E tests for debounce, URL initialization, API switching, filter reset, errors, and pagination.
3. Display “interpreted as,” typo corrections, and fallback status in a buyer-friendly form.
4. Add structured logs and metrics for mode, latency, provider error, fallback rate, zero results, and candidate counts.
5. Add an embedding version/model field and a migration state so incompatible vectors cannot be mixed silently.

### Search-quality improvements

1. Build make/model vocabulary from approved inventory or a canonical vehicle table.
2. Add a relevance threshold and an explicit “no sufficiently relevant result” behavior.
3. Use Atlas Search/BM25 for the lexical branch, with fuzzy matching, synonyms, field weights, and autocomplete.
4. Use reciprocal-rank fusion or normalized score fusion if vector and lexical score distributions prove hard to compare.
5. Create a judged test set of real buyer queries and calculate metrics such as Precision@K, Recall@K, MRR, and NDCG.
6. Calibrate the 65/35 weights from evidence rather than intuition.
7. Add multilingual query normalization and Sri Lankan location aliases.

### Scalability improvements

1. Move all reproducible filter state into the URL.
2. Replace deep `skip` pagination with cursor-based pagination where exact sort stability is required.
3. Store normalized exact-match fields for make/location and use indexes that match query semantics.
4. Cache popular query embeddings and possibly short-lived anonymous result pages.
5. Queue failed listing embeddings for retry instead of relying only on manual backfill.

## 21. Likely viva questions and concise answers

### Why have both `/listings` and `/search`?

Ordinary browsing should not pay semantic-search cost. `/listings` is efficient filter browsing; `/search` adds query interpretation, relevance, semantic retrieval, and search metadata.

### Why not use an LLM to parse every query?

Hard constraints need deterministic, testable behavior. Rules are faster, cheaper, and cannot hallucinate a price or transmission. Embeddings still provide semantic matching for residual intent.

### Why extract filters before vector search?

Price, year, transmission, and similar requirements are constraints, not preferences. Pre-filtering improves correctness and reduces the vector search space.

### Why combine semantic and lexical scores?

Semantic similarity captures meaning and paraphrases; lexical score rewards exact buyer terms. Combining them balances intent and precision.

### Why 65% semantic and 35% lexical?

It intentionally gives semantic intent the larger role while preserving exact-term influence. It is an initial engineering choice and should later be calibrated with judged queries.

### Why normalize embeddings?

L2 normalization gives vectors unit length, making direction rather than magnitude the meaningful signal and keeping cosine comparisons consistent.

### Why are listing and query models required to match?

Coordinates only have meaning inside the model that produced them. Two different models can both output 384 values while assigning completely different meanings to every dimension.

### Why hide the embedding field?

It is internal retrieval data. Sending 384 floats per listing wastes bandwidth, serialization time, and client memory and exposes an implementation detail.

### What makes fallback graceful?

The service catches failures only in query embedding/vector retrieval, continues with already requested structured candidates, reports `lexical-fallback`, and still returns a normal success response.

### How do you prevent private inventory leakage?

Both standard and vector filter builders require `status=active`; the buyer detail endpoint also queries only active listings.

### How do you prevent regex injection?

Every user value is escaped before constructing a regex, and query lengths are bounded.

### Why debounce in the UI?

It coalesces rapid keystrokes into one settled request, reducing network, server, database, Atlas, and provider work without requiring a submit button.

### Why keep previous results during refresh?

It prevents the grid from flashing empty on every change and gives a smoother perceived response while clearly announcing “Updating…”.

### How does typo correction work?

It compares sufficiently long tokens against controlled make/model vocabularies using Levenshtein edit distance, accepts only one or two edits depending on length, and reports the mapping in response metadata.

### What happens when a dealer edits searchable data?

The service regenerates the vector. If regeneration fails, it removes the stale vector and the listing remains available to structured/lexical search.

### Is local fallback truly semantic?

No. It is deterministic signed feature hashing over tokens. It supports offline development and lexical-like similarity, but MiniLM/Atlas with consistent vectors is the production semantic path.

### How would you evaluate search quality?

Collect representative queries, have humans judge relevant listings, then measure Precision@K, Recall@K, MRR, and NDCG. Also monitor zero-result, reformulation, click-through, fallback, and latency rates.

### What is the biggest current technical risk?

Operationally, mixing embedding modes/models without a full backfill. For search quality, the bounded/simple lexical fallback and absence of a relevance threshold are the largest current limitations.

## 22. File-by-file ownership map

| File | Responsibility |
|---|---|
| `apps/frontend/src/app/LandingPage.tsx` | Hero search and URL navigation |
| `apps/frontend/src/portals/buyer/pages/Marketplace.tsx` | Search/filter UI, debounce, URL state, result states, sorting, pagination |
| `apps/frontend/src/features/buyers/hooks/useBuyerListings.ts` | Filter/page state, React Query cache, API-path selection |
| `apps/frontend/src/features/buyers/services/buyerApi.ts` | HTTP calls and DTO-to-UI mapping |
| `apps/frontend/src/features/listings/types/listing.types.ts` | Frontend filter and listing types |
| `apps/frontend/src/index.css` | Search layout, responsive, focus, reduced motion |
| `apps/backend/src/app.ts` | Mounts `/api/v1/search` |
| `apps/backend/src/modules/search/search.routes.ts` | Public GET route and validation middleware |
| `apps/backend/src/modules/search/search.validation.ts` | Search parameter contract and range checks |
| `apps/backend/src/modules/search/search.controller.ts` | HTTP-to-service adapter and success response |
| `apps/backend/src/modules/search/search.queryAnalyzer.ts` | Natural-language extraction and fuzzy correction |
| `apps/backend/src/modules/search/search.embedding.ts` | Query/manual-listing embedding generation |
| `apps/backend/src/modules/search/search.repository.ts` | Shared filters, structured queries, vector aggregation, sorts |
| `apps/backend/src/modules/search/search.service.ts` | Mode selection, concurrent retrieval, merge, ranking, pagination, metadata |
| `apps/backend/src/modules/buyers/buyer.repository.ts` | Delegates public browse to shared structured search |
| `apps/backend/src/modules/marketplace/listing.model.ts` | Listing embedding field and MongoDB indexes |
| `apps/backend/src/modules/marketplace/listing.service.ts` | Manual create/update embedding lifecycle |
| `packages/shared-contracts/src/search/embedding.ts` | Dimensions, text composition, normalization, local hashing |
| `apps/worker/src/pipeline/generateEmbedding.ts` | Worker-side hosted/local embedding generation |
| `apps/worker/src/pipeline/persist.ts` | Bounded concurrent CSV embedding integration |
| `apps/worker/src/repositories/listing.repository.ts` | Worker schema and embedding persistence |
| `apps/backend/scripts/backfill-search-embeddings.mjs` | Existing-document migration/rebuild |
| `docs/search-operations.md` | Atlas index and production operation instructions |
| `docs/api-contract.md` | Public API contract |

## 23. Final conclusion

MotorX search is a layered retrieval system. Structured filtering guarantees hard constraints and public visibility rules. The natural-language analyzer converts common buyer language into those constraints. Controlled fuzzy matching handles common make/model mistakes. Shared embedding generation gives listings and queries a comparable representation. Atlas retrieves semantic candidates, lexical scoring preserves exact words, and the service combines both signals in a bounded ranking pipeline. The frontend makes the system practical through URL entry, debouncing, cached updates, sorting, pagination, responsive controls, and accessible feedback.

The design’s strongest quality is graceful layering: exact browsing remains cheap, intelligent search activates only when needed, and semantic infrastructure can fail without taking down marketplace discovery. Its next maturity step is not “more AI”; it is better relevance evaluation, observability, integration testing, vector-version control, and a stronger lexical retrieval engine.
