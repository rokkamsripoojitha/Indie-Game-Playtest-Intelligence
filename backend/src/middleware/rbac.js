import mongoose from 'mongoose';
import { StudioMembership } from '../models/StudioMembership.js';

export const extractStudioId = (req) => {
  return (
    req.params.studioId ||
    req.body.studioId ||
    req.query.studioId ||
    req.headers['x-studio-id'] ||
    null
  );
};

// Require membership in the studio with one of the allowed roles ('tester' or 'developer')
export const requireStudioRole = (allowedRoles = ['tester', 'developer']) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const studioId = extractStudioId(req);
      if (!studioId) {
        return res.status(400).json({
          success: false,
          message: 'Studio context (studioId) is required to access this resource.'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(studioId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid studioId format.'
        });
      }

      const membership = await StudioMembership.findOne({
        userId: req.user._id,
        studioId: studioId,
        status: 'active'
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this studio.'
        });
      }

      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      // Normalize role: treat studio_admin as developer for backward compatibility
      const normalizedRole = membership.role === 'studio_admin' ? 'developer' : membership.role;

      if (!rolesArray.includes(normalizedRole) && !rolesArray.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. This action requires one of the following roles: ${rolesArray.join(', ')}.`
        });
      }

      req.membership = membership;
      req.studioId = studioId;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Explicit check for Developer-only actions (Confirm issues, verify fixes, run AI investigation)
export const requireDeveloperOnly = async (req, res, next) => {
  try {
    if (!req.membership) {
      return res.status(403).json({
        success: false,
        message: 'Studio membership required.'
      });
    }

    const role = req.membership.role;
    if (role !== 'developer' && role !== 'studio_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only authorized developers can perform this action.'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

