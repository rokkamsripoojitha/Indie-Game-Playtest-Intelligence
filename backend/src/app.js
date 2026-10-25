import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { config } from './config/env.js';
import { setCsrfToken } from './middleware/csrf.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

export const createApp = () => {
  const app = express();

  // Trust first proxy if running behind reverse proxy
  if (config.isProduction) {
    app.set('trust proxy', 1);
  }

  // Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-XSRF-Token', 'x-studio-id']
    })
  );

  // Request parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Session configuration with MongoStore
  const sessionConfig = {
    name: 'sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'none' : 'lax',
      maxAge: config.sessionMaxAgeMs
    }
  };

  // Attach MongoStore if connection string is configured
  if (config.mongoUri) {
    try {
      sessionConfig.store = MongoStore.create({
        mongoUrl: config.mongoUri,
        collectionName: 'sessions',
        ttl: config.sessionMaxAgeMs / 1000,
        autoRemove: 'native'
      });
    } catch (e) {
      console.warn('[Session] MongoStore initialization deferred, using memory store fallback.');
    }
  }

  app.use(session(sessionConfig));

  // Auto-attach CSRF cookie on initial handshakes
  app.use(setCsrfToken);

  // General rate limiter on all API traffic
  app.use('/api', generalLimiter);

  // Mount API modular routes
  app.use('/api', apiRoutes);

  // Root welcome route
  app.get('/', (req, res) => {
    res.json({
      name: 'Indie Game Playtest Intelligence API',
      status: 'operational',
      documentation: '/api/health',
      version: '1.0.0'
    });
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};
