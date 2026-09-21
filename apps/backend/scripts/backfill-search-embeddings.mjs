import { config as loadEnvironment } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { composeListingSearchText, createLocalSearchEmbedding, normalizeEmbeddingResponse, SEARCH_EMBEDDING_DIMENSIONS } from '@motorx/shared-contracts';

// npm workspace scripts run with apps/backend as their working directory, so load the repository
// root environment relative to this file instead of relying on process.cwd().
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
loadEnvironment({ path: resolve(scriptDirectory, '../../../.env') });

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is required.');
const model = process.env.HF_EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';

async function embed(text) {
  if (!process.env.HF_API_KEY) return createLocalSearchEmbedding(text);
  const response = await fetch(`https://api-inference.huggingface.co/pipeline/feature-extraction/${encodeURIComponent(model)}`, {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.HF_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text.slice(0, 5_000), options: { wait_for_model: true } }), signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Embedding provider returned ${response.status}.`);
  const vector = normalizeEmbeddingResponse(await response.json());
  if (vector.length !== SEARCH_EMBEDDING_DIMENSIONS) throw new Error(`Expected ${SEARCH_EMBEDDING_DIMENSIONS} dimensions, received ${vector.length}.`);
  return vector;
}

await mongoose.connect(uri);
const collection = mongoose.connection.collection('listings');
const filter = process.argv.includes('--all') ? {} : { $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }] };
let processed = 0;
try {
  const cursor = collection.find(filter, { projection: { title: 1, make: 1, model: 1, year: 1, category: 1, location: 1, description: 1, attributes: 1 } }).batchSize(50);
  for await (const listing of cursor) {
    const embedding = await embed(composeListingSearchText(listing));
    await collection.updateOne({ _id: listing._id }, { $set: { embedding } });
    processed += 1;
    if (processed % 50 === 0) console.log(`Backfilled ${processed} listings.`);
  }
  console.log(`Search embedding backfill complete: ${processed} listings updated.`);
} finally {
  await mongoose.disconnect();
}
