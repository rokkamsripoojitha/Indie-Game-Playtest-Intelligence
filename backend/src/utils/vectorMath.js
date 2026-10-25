/**
 * Compute the cosine similarity between two numeric vectors.
 * Returns a value between -1.0 and 1.0.
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }

  const length = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Format cosine similarity (-1 to 1) into a clean percentage or 0..1 score.
 */
export const normalizeSimilarity = (score) => {
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, (score + 1) / 2));
};
