import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`[Server] Indie Game Playtest Intelligence Backend`);
    console.log(`[Server] Listening on http://localhost:${config.port}`);
    console.log(`[Server] Health check: http://localhost:${config.port}/api/health`);
    console.log(`[Server] Environment: ${config.nodeEnv}`);
    console.log(`=======================================================`);
  });

  const shutdown = () => {
    console.log('\n[Server] Gracefully shutting down...');
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startServer();
