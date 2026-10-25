import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/playtest_intelligence',
  vectorIndexName: process.env.MONGODB_VECTOR_INDEX_NAME || 'playtest_vector_index',
  sessionSecret: process.env.SESSION_SECRET || 'dev_secure_session_secret_fallback_key',
  sessionMaxAgeMs: parseInt(process.env.SESSION_MAX_AGE_MS, 10) || 86400000, // 24 hours
  llmProvider: process.env.LLM_PROVIDER || 'ollama',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  llmModel: process.env.LLM_MODEL || 'qwen2.5:3b',
  embeddingModel: process.env.EMBEDDING_MODEL || 'all-minilm',
  embeddingDimension: parseInt(process.env.EMBEDDING_DIMENSION, 10) || 384,
  emailEnabled: process.env.EMAIL_SERVICE_ENABLED === 'true',
  fromEmail: process.env.FROM_EMAIL || 'no-reply@playtest-intelligence.local',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES, 10) || 10 * 1024 * 1024
};
