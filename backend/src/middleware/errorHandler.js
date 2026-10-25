import { config } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  // Safe logging: log status and message, omit sensitive request bodies
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  console.error(`[Error] ${req.method} ${req.originalUrl} - ${err.message}`);
  if (err.stack && !config.isProduction) {
    console.error(err.stack);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages
    });
  }

  // Handle Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format for: ${err.path}`
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    ...(config.isProduction ? {} : { stack: err.stack })
  });
};
