import axios from 'axios';
import { createLocalSearchEmbedding, normalizeEmbeddingResponse, SEARCH_EMBEDDING_DIMENSIONS } from '@motorx/shared-contracts';
import { env } from '../config/env.js';

// Uses the configured semantic model, while keeping local imports operational without a hosted key.
export async function generateEmbedding(text: string): Promise<number[]> {
  const normalizedText = text.trim().slice(0, 5_000);
  if (!env.HF_API_KEY) return createLocalSearchEmbedding(normalizedText);
  const response = await axios.post(
    `https://api-inference.huggingface.co/pipeline/feature-extraction/${encodeURIComponent(env.HF_EMBEDDING_MODEL)}`,
    { inputs: normalizedText, options: { wait_for_model: true } },
    { headers: { Authorization: `Bearer ${env.HF_API_KEY}` }, timeout: env.EMBEDDING_TIMEOUT_MS },
  );
  const embedding = normalizeEmbeddingResponse(response.data);
  if (embedding.length !== SEARCH_EMBEDDING_DIMENSIONS) throw new Error(`Expected ${SEARCH_EMBEDDING_DIMENSIONS} embedding dimensions, received ${embedding.length}.`);
  return embedding;
}
