import { createLocalSearchEmbedding, normalizeEmbeddingResponse, SEARCH_EMBEDDING_DIMENSIONS } from '@motorx/shared-contracts';
import { env } from '../../config/env.js';

// Query and listing vectors always use the same configured model and dimensions.
export async function generateSearchEmbedding(text: string): Promise<number[]> {
  const normalizedText = text.trim().slice(0, 5_000);
  if (!env.HF_API_KEY) return createLocalSearchEmbedding(normalizedText);
  const response = await fetch(`https://api-inference.huggingface.co/pipeline/feature-extraction/${encodeURIComponent(env.HF_EMBEDDING_MODEL)}`, {
    method: 'POST', headers: { Authorization: `Bearer ${env.HF_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: normalizedText, options: { wait_for_model: true } }), signal: AbortSignal.timeout(env.EMBEDDING_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Embedding provider request failed with status ${response.status}.`);
  const embedding = normalizeEmbeddingResponse(await response.json());
  if (embedding.length !== SEARCH_EMBEDDING_DIMENSIONS) throw new Error(`Expected ${SEARCH_EMBEDDING_DIMENSIONS} embedding dimensions, received ${embedding.length}.`);
  return embedding;
}
