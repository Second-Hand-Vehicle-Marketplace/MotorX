# Search operations

MotorX exposes public browse filters at `GET /api/v1/listings` and natural-language search at `GET /api/v1/search?q=...`. Both paths use the same validated filter builder and only return active listings.

## Vector index

Create an Atlas Vector Search index named `listing_embedding_index` on the `listings` collection:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 384, "similarity": "cosine" },
    { "type": "filter", "path": "status" },
    { "type": "filter", "path": "category" },
    { "type": "filter", "path": "price" },
    { "type": "filter", "path": "year" },
    { "type": "filter", "path": "attributes.fuelType" },
    { "type": "filter", "path": "attributes.transmission" },
    { "type": "filter", "path": "attributes.bodyType" },
    { "type": "filter", "path": "attributes.condition" },
    { "type": "filter", "path": "attributes.mileageKm" }
  ]
}
```

Set `ATLAS_VECTOR_INDEX` if a different name is used. Local MongoDB does not implement `$vectorSearch`; the endpoint detects that failure and continues with bounded lexical ranking.

## Embeddings and backfill

Set `HF_API_KEY` to use `HF_EMBEDDING_MODEL`. With no key, both the backend and worker use the same normalized 384-dimension local token embedding, keeping local development self-contained. When the configured model changes, regenerate every vector:

```sh
npm run search:backfill --workspace @motorx/backend -- --all
```

Without `--all`, only listings with no vector are processed. Run the backfill before switching production traffic to a new model.

## Non-functional safeguards

- Request validation caps natural-language queries at 200 characters, pages at 50 results, and rejects inverted ranges.
- User text is escaped before MongoDB regex construction. Search is public and read-only, and always enforces `status: active`.
- Indexed structured queries target less than 2 seconds. Semantic calls have a 4-second hard timeout and fall back to lexical ranking, keeping the project target below 5 seconds under normal database operation.
- Hybrid ranking examines at most 300 structured and 200 vector candidates, preventing unbounded application memory and response work.
- The UI debounces requests, keeps prior results during refresh, supports retry/empty/loading states, visible keyboard focus, reduced motion, semantic labels, and responsive layouts.
- Track API p95 latency, embedding-provider error rate, lexical-fallback rate, zero-result rate, and Atlas query execution time in production. Alert when p95 exceeds the Sprint 6 targets.
