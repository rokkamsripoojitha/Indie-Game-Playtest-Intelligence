import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    isConnected = true;
    console.log(`[Database] MongoDB successfully connected to: ${config.mongoUri.replace(/:([^@]+)@/, ':****@')}`);
  } catch (error) {
    isConnected = false;
    console.error(`[Database] MongoDB connection failed: ${error.message}`);
    // Do not crash the entire process during startup if Mongo is still coming up;
    // Health checks and middleware will report database availability honestly.
  }

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[Database] MongoDB connection disconnected.');
  });

  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log('[Database] MongoDB connected.');
  });
};

export const getDBStatus = () => {
  return {
    isConnected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null
  };
};
