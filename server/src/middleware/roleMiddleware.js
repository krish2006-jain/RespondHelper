import { sendError } from '../utils/apiResponse.js';

/**
 * Role-Based Access Control Middleware
 * @param  {...string} allowedRoles
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    // Admins can access all role endpoints
    if (req.user.role === 'admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. This action requires one of the following roles: [${allowedRoles.join(', ')}]`,
        403
      );
    }

    next();
  };
};

/**
 * Responder Verification Middleware
 * Requires verified status for responders to accept tasks or publish resources
 */
export const requireVerified = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Authentication required', 401);
  }

  // Survivors and Admins don't need responder verification
  if (req.user.role === 'survivor' || req.user.role === 'admin') {
    return next();
  }

  if (req.user.verificationStatus !== 'verified') {
    return sendError(
      res,
      'Your responder account is currently pending admin verification. You cannot perform this action yet.',
      403,
      { verificationStatus: req.user.verificationStatus }
    );
  }

  next();
};
