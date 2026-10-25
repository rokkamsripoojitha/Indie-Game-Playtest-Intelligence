import crypto from 'crypto';
import { config } from '../config/env.js';

// Attach or refresh a CSRF token on session and cookie
export const setCsrfToken = (req, res, next) => {
  if (!req.session) {
    return next();
  }

  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  // Set as readable cookie so frontend can extract and send in X-CSRF-Token header
  res.cookie('XSRF-TOKEN', req.session.csrfToken, {
    httpOnly: false, // Must be readable by frontend JavaScript to attach in headers
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    maxAge: config.sessionMaxAgeMs
  });

  next();
};

// Verify CSRF token on mutating requests
export const verifyCsrf = (req, res, next) => {
  // Safe HTTP methods do not modify state and bypass CSRF check
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // If in development/test and explicit bypass header or route is present, allow if needed
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const tokenFromHeader = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  const sessionToken = req.session ? req.session.csrfToken : null;

  if (!sessionToken || !tokenFromHeader || tokenFromHeader !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token. State-changing requests must include a valid X-CSRF-Token.'
    });
  }

  next();
};
