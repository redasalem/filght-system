import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Lazily-initialised Google Generative AI client.
 * Uses text-embedding-004 model (768 dimensions).
 */
let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        '[AeroFlow Embedding] GEMINI_API_KEY is not set in environment variables.'
      );
    }
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
}

/**
 * Generate a 768-dimensional embedding vector from a text prompt
 * using Google's text-embedding-004 model.
 *
 * @param text - The user's natural language travel query.
 * @returns number[] - A 768-dimension float vector for pgvector cosine search.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-embedding-001' });

  // Type definition in @google/generative-ai may not declare outputDimensionality yet,
  // but the REST endpoint supports it (MRL 768 dims).
  const result = await (model.embedContent as any)({
    content: { parts: [{ text }], role: 'user' },
    outputDimensionality: 768,
  });

  return result.embedding.values;
}
