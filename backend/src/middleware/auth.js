import { User } from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.'
      });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      // Clear invalid session
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: 'Session is invalid or user account no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required. Please verify your email before accessing this resource.',
      isVerified: false
    });
  }

  next();
};
