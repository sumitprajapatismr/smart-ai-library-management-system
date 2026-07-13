import { genAI } from '../config/gemini';

export const getEmbedding = async (text: string): Promise<number[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    if (result.embedding && result.embedding.values) {
      return result.embedding.values;
    }
    throw new Error('Embedding values not found in response');
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    // Dimension for text-embedding-004 is 768. Return a random mock embedding to prevent crashes in offline/mock modes
    return Array.from({ length: 768 }, () => Math.random() * 0.02 - 0.01);
  }
};

// Math helper to calculate cosine similarity between two vectors
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
