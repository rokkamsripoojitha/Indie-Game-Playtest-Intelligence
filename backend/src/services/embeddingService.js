import crypto from 'crypto';
import { config } from '../config/env.js';

let isOllamaEmbeddingAvailable = null;
let lastOllamaCheckTime = 0;

export const checkEmbeddingHealth = async () => {
  const now = Date.now();
  if (isOllamaEmbeddingAvailable !== null && now - lastOllamaCheckTime < 10000) {
    return isOllamaEmbeddingAvailable
      ? { available: true, provider: 'ollama', model: config.embeddingModel, dimension: config.embeddingDimension }
      : { available: false, provider: 'ollama', model: config.embeddingModel, fallback: 'deterministic_feature_projection' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(`${config.ollamaBaseUrl}/api/tags`, {
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const models = (data.models || []).map(m => m.name);
      const hasModel = models.some(m => m.includes(config.embeddingModel));
      isOllamaEmbeddingAvailable = true;
      lastOllamaCheckTime = Date.now();
      return {
        available: true,
        provider: 'ollama',
        model: config.embeddingModel,
        dimension: config.embeddingDimension,
        modelLoaded: hasModel
      };
    }
  } catch (err) {
    isOllamaEmbeddingAvailable = false;
    lastOllamaCheckTime = Date.now();
  }

  return {
    available: false,
    provider: 'ollama',
    model: config.embeddingModel,
    dimension: config.embeddingDimension,
    fallback: 'deterministic_feature_projection',
    message: `Ollama is not responding at ${config.ollamaBaseUrl}. Local development fallback active.`
  };
};

/**
 * Deterministic semantic feature-projection embedding generator for development fallback.
 * Maps n-grams, word stems, and token hashes into a normalized d-dimensional vector.
 * Captures semantic overlap across lexical paraphrasing (e.g. "open inventory", "inventory control", "accessing items").
 */
const generateDeterministicEmbedding = (text, dimension = 384) => {
  const vector = new Array(dimension).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(w => w.length > 1);

  // Key semantic concept clusters for gaming/playtest domain
  const semanticConcepts = [
    { keys: ['inventory', 'items', 'bag', 'backpack', 'equip', 'loot'], slot: 0 },
    { keys: ['tutorial', 'opening', 'prologue', 'intro', 'start', 'level 1', 'first level'], slot: 10 },
    { keys: ['controller', 'gamepad', 'button', 'keys', 'input', 'rebind', 'mouse', 'keyboard'], slot: 20 },
    { keys: ['crash', 'freeze', 'hang', 'fatal', 'exception', 'startup', 'black screen'], slot: 30 },
    { keys: ['graphics', 'fps', 'resolution', 'stutter', 'lag', 'vsync', 'hdr'], slot: 40 },
    { keys: ['audio', 'sound', 'music', 'voice', 'mute', 'volume'], slot: 50 },
    { keys: ['quest', 'npc', 'dialogue', 'story', 'objective', 'mission'], slot: 60 },
    { keys: ['save', 'load', 'checkpoint', 'progress', 'corrupt'], slot: 70 },
    { keys: ['multiplayer', 'lobby', 'disconnect', 'ping', 'server', 'matchmaking'], slot: 80 }
  ];

  // Boost weights for matched semantic concept groups
  for (const concept of semanticConcepts) {
    for (const key of concept.keys) {
      if (normalized.includes(key)) {
        for (let i = 0; i < 10; i++) {
          const index = (concept.slot + i) % dimension;
          vector[index] += 3.5;
        }
      }
    }
  }

  // Token hash projections into vector space
  for (const word of words) {
    const hash = crypto.createHash('md5').update(word).digest();
    for (let i = 0; i < 4; i++) {
      const idx = hash.readUInt16BE(i * 2) % dimension;
      vector[idx] += 1.0;
    }
  }

  // Character trigrams
  for (let i = 0; i < normalized.length - 2; i++) {
    const trigram = normalized.substring(i, i + 3);
    const hash = crypto.createHash('md5').update(trigram).digest();
    const idx = hash.readUInt16BE(0) % dimension;
    vector[idx] += 0.3;
  }

  // Normalize to unit length (L2 norm)
  let norm = 0;
  for (let i = 0; i < dimension; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimension; i++) {
      vector[i] = Number((vector[i] / norm).toFixed(6));
    }
  }

  return vector;
};

/**
 * Generate embedding vector for a given text.
 * Automatically attempts Ollama endpoint first; falls back gracefully to deterministic vector projection.
 */
export const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Text is required to generate an embedding.');
  }

  // If Ollama is marked offline, skip waiting for network timeout
  if (isOllamaEmbeddingAvailable === false) {
    const vector = generateDeterministicEmbedding(text, config.embeddingDimension);
    return {
      embedding: vector,
      model: `${config.embeddingModel}-dev-fallback`,
      dimension: config.embeddingDimension,
      provider: 'local_deterministic_projection'
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${config.ollamaBaseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.embeddingModel,
        prompt: text
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.embedding) && data.embedding.length > 0) {
        isOllamaEmbeddingAvailable = true;
        return {
          embedding: data.embedding,
          model: config.embeddingModel,
          dimension: data.embedding.length,
          provider: 'ollama'
        };
      }
    }
  } catch (error) {
    isOllamaEmbeddingAvailable = false;
  }

  // Fallback vector generation
  const vector = generateDeterministicEmbedding(text, config.embeddingDimension);
  return {
    embedding: vector,
    model: `${config.embeddingModel}-dev-fallback`,
    dimension: config.embeddingDimension,
    provider: 'local_deterministic_projection'
  };
};
