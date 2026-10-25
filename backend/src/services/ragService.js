import mongoose from 'mongoose';
import { BuildDocument } from '../models/BuildDocument.js';
import { Build } from '../models/Build.js';
import { generateEmbedding } from './embeddingService.js';
import { cosineSimilarity } from '../utils/vectorMath.js';
import { config } from '../config/env.js';

/**
 * Split text into overlapping chunks.
 */
export const chunkText = (text, chunkSize = 400, overlap = 80) => {
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let i = 0;

  while (i < words.length) {
    const chunkWords = words.slice(i, i + chunkSize);
    const chunkText = chunkWords.join(' ');
    chunks.push(chunkText);
    i += Math.max(1, chunkSize - overlap);
  }

  return chunks;
};

/**
 * Index a document for a specific build with chunking and embeddings.
 */
export const indexBuildDocument = async ({
  studioId,
  buildId,
  title,
  sourceType = 'guide',
  content,
  originalFilename = '',
  uploadedBy
}) => {
  if (!studioId || !buildId || !title || !content) {
    throw new Error('studioId, buildId, title, and content are required.');
  }

  const rawChunks = chunkText(content, 200, 40);
  const embeddedChunks = [];

  for (let idx = 0; idx < rawChunks.length; idx++) {
    const chunkStr = rawChunks[idx];
    const { embedding } = await generateEmbedding(chunkStr);
    embeddedChunks.push({
      chunkIndex: idx,
      text: chunkStr,
      embedding
    });
  }

  const doc = await BuildDocument.create({
    studioId,
    buildId,
    title,
    sourceType,
    originalFilename,
    chunks: embeddedChunks,
    embeddingModel: config.embeddingModel,
    embeddingStatus: 'completed',
    uploadedBy
  });

  return doc;
};

/**
 * Retrieve relevant chunks strictly scoped to the specified build and studio.
 * Specification: A query for Build B must NOT silently retrieve outdated Build A instructions.
 */
export const retrieveChunksForBuild = async ({
  studioId,
  buildId,
  query,
  limit = 3,
  minSimilarity = 0.40
}) => {
  const { embedding: queryVector } = await generateEmbedding(query);

  const documents = await BuildDocument.find({
    studioId: new mongoose.Types.ObjectId(studioId),
    buildId: new mongoose.Types.ObjectId(buildId),
    embeddingStatus: 'completed'
  }).populate('buildId', 'version buildName');

  const build = await Build.findById(buildId).select('version buildName');
  const buildVersion = build ? build.version : 'Unknown';

  const scoredChunks = [];

  for (const doc of documents) {
    for (const chunk of doc.chunks) {
      if (chunk.embedding && chunk.embedding.length > 0) {
        const score = cosineSimilarity(queryVector, chunk.embedding);
        if (score >= minSimilarity) {
          scoredChunks.push({
            documentId: doc._id,
            title: doc.title,
            buildVersion: buildVersion,
            chunkIndex: chunk.chunkIndex,
            text: chunk.text,
            similarityScore: Number(score.toFixed(4)),
            sourceType: doc.sourceType
          });
        }
      }
    }
  }

  // Sort descending by similarity
  scoredChunks.sort((a, b) => b.similarityScore - a.similarityScore);
  return scoredChunks.slice(0, limit);
};

/**
 * Generate a grounded answer with citations using retrieved chunks and the configured LLM.
 */
export const answerSetupQuestion = async ({ studioId, buildId, question }) => {
  const relevantChunks = await retrieveChunksForBuild({
    studioId,
    buildId,
    query: question,
    limit: 3,
    minSimilarity: 0.35
  });

  const build = await Build.findById(buildId).select('version buildName');
  const buildVersion = build ? build.version : 'selected build';

  // If no relevant documents exist for this build
  if (!relevantChunks || relevantChunks.length === 0) {
    return {
      answer: `I could not find relevant documentation for Build ${buildVersion} regarding your query. The permitted documents for this build do not provide enough information to answer this question.`,
      citations: [],
      grounded: false,
      buildVersion
    };
  }

  // Assemble citations list
  const citations = relevantChunks.map(c => ({
    documentId: c.documentId,
    title: c.title,
    buildVersion: c.buildVersion,
    chunkIndex: c.chunkIndex,
    excerpt: c.text.length > 200 ? c.text.substring(0, 200) + '...' : c.text,
    similarityScore: c.similarityScore
  }));

  const contextText = relevantChunks
    .map((c, i) => `[Source ${i + 1}] (${c.title} - Build ${c.buildVersion}):\n${c.text}`)
    .join('\n\n');

  // Attempt generation via Ollama LLM
  try {
    const prompt = `You are a helpful game assistant for playtesters. Answer the player's setup question strictly using the provided documentation for Build ${buildVersion}.
Do not fabricate information. If the documentation does not contain the answer, state that the documentation does not contain enough information.
Cite your sources using [Source 1], [Source 2], etc.

Documentation Context:
${contextText}

Player Question: ${question}

Grounded Answer:`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${config.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.llmModel,
        prompt: prompt,
        stream: false
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.response && data.response.trim().length > 0) {
        return {
          answer: data.response.trim(),
          citations,
          grounded: true,
          buildVersion,
          llmProvider: 'ollama'
        };
      }
    }
  } catch (err) {
    // LLM not available or timed out
  }

  // Fallback synthesis grounded strictly on top chunk
  const topChunk = relevantChunks[0];
  const fallbackAnswer = `Based on the official documentation for Build ${buildVersion} ("${topChunk.title}"):\n\n${topChunk.text}\n\n(Note: Generated via grounded document retrieval fallback)`;

  return {
    answer: fallbackAnswer,
    citations,
    grounded: true,
    buildVersion,
    llmProvider: 'grounded_retrieval_synthesizer'
  };
};
