import { getDBStatus } from '../config/db.js';
import { checkEmbeddingHealth } from '../services/embeddingService.js';
import { checkVectorIndexStatus } from '../services/vectorService.js';
import { config } from '../config/env.js';

export const getHealthStatus = async (req, res) => {
  const dbStatus = getDBStatus();
  const embeddingStatus = await checkEmbeddingHealth();
  const vectorIndexStatus = await checkVectorIndexStatus();

  // Check LLM generation health
  let llmAvailable = false;
  let llmDetails = {
    provider: config.llmProvider,
    model: config.llmModel,
    baseUrl: config.ollamaBaseUrl
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const ollamaRes = await fetch(`${config.ollamaBaseUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    if (ollamaRes.ok) {
      llmAvailable = true;
      const data = await ollamaRes.json();
      llmDetails.loadedModels = (data.models || []).map(m => m.name);
    }
  } catch (err) {
    llmAvailable = false;
    llmDetails.offlineNotice = 'Ollama local server offline. Grounded retrieval fallback active.';
  }

  const isHealthy = dbStatus.isConnected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      api: {
        status: 'running',
        environment: config.nodeEnv,
        uptimeSeconds: Math.floor(process.uptime())
      },
      database: {
        status: dbStatus.isConnected ? 'connected' : 'disconnected',
        details: dbStatus
      },
      llm: {
        status: llmAvailable ? 'available' : 'offline',
        details: llmDetails
      },
      embeddingModel: {
        status: embeddingStatus.available ? 'available' : 'fallback_active',
        details: embeddingStatus
      },
      vectorIndex: {
        status: vectorIndexStatus.status,
        details: vectorIndexStatus
      },
      emailService: {
        status: config.emailEnabled ? 'enabled' : 'dev_simulation',
        from: config.fromEmail
      }
    }
  });
};
