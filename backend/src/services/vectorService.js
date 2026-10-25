import mongoose from 'mongoose';
import { FeedbackReport } from '../models/FeedbackReport.js';
import { cosineSimilarity } from '../utils/vectorMath.js';
import { config } from '../config/env.js';

export const checkVectorIndexStatus = async () => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const hasFeedback = collections.some(c => c.name === 'feedbackreports');
    return {
      configured: true,
      indexName: config.vectorIndexName,
      dimension: config.embeddingDimension,
      status: hasFeedback ? 'ready_or_fallback_available' : 'awaiting_collection'
    };
  } catch (err) {
    return {
      configured: false,
      indexName: config.vectorIndexName,
      dimension: config.embeddingDimension,
      status: 'unavailable',
      error: err.message
    };
  }
};

/**
 * Perform semantic search for similar feedback reports within the same studio and build.
 * Uses MongoDB Atlas $vectorSearch if available; otherwise falls back to exact in-memory cosine similarity
 * across high-dimensional embeddings for local development.
 */
export const findSimilarFeedback = async ({
  studioId,
  buildId,
  excludeReportId = null,
  embedding,
  limit = 5,
  minSimilarity = 0.60
}) => {
  if (!studioId || !buildId || !embedding) {
    throw new Error('studioId, buildId, and query embedding are required for semantic search.');
  }

  const sId = new mongoose.Types.ObjectId(studioId);
  const bId = new mongoose.Types.ObjectId(buildId);

  // 1. Try Atlas Vector Search aggregation pipeline
  try {
    const pipeline = [
      {
        $vectorSearch: {
          index: config.vectorIndexName,
          path: 'embedding',
          queryVector: embedding,
          numCandidates: 20,
          limit: limit + (excludeReportId ? 1 : 0),
          filter: {
            studioId: sId,
            buildId: bId
          }
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          stepsToReproduce: 1,
          expectedBehavior: 1,
          actualBehavior: 1,
          status: 1,
          createdAt: 1,
          testerId: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    const atlasResults = await FeedbackReport.aggregate(pipeline);
    if (atlasResults && atlasResults.length > 0) {
      const filtered = atlasResults
        .filter(r => !excludeReportId || r._id.toString() !== excludeReportId.toString())
        .filter(r => (r.score || 0) >= minSimilarity)
        .slice(0, limit);

      return {
        results: filtered.map(r => ({
          report: r,
          similarityScore: Number((r.score || 0).toFixed(4)),
          sourceEngine: 'mongodb_atlas_vector_search'
        })),
        engine: 'mongodb_atlas_vector_search'
      };
    }
  } catch (atlasErr) {
    // Expected when running on local MongoDB or before Atlas index creation
    // Transparently fall back to exact cosine similarity over stored vectors
  }

  // 2. Development Fallback: In-memory exact Cosine Similarity Search over vector embeddings
  const query = {
    studioId: sId,
    buildId: bId,
    embedding: { $exists: true, $ne: [] }
  };

  if (excludeReportId) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeReportId) };
  }

  const candidateReports = await FeedbackReport.find(query)
    .select('title description stepsToReproduce expectedBehavior actualBehavior status createdAt testerId embedding embeddingModel')
    .lean();

  const scoredCandidates = candidateReports
    .map(report => {
      const score = cosineSimilarity(embedding, report.embedding);
      const safeReport = { ...report };
      delete safeReport.embedding; // Do not bloat response payload with raw vector
      return {
        report: safeReport,
        similarityScore: Number(score.toFixed(4)),
        sourceEngine: 'development_cosine_vector_engine'
      };
    })
    .filter(item => item.similarityScore >= minSimilarity)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);

  return {
    results: scoredCandidates,
    engine: 'development_cosine_vector_engine',
    scannedCount: candidateReports.length
  };
};
