import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ENV } from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 'User no longer exists.', 401);
    }

    if (user.isBlocked) {
      return sendError(res, 'Your account has been suspended by an administrator.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Session token expired. Please refresh or log in again.', 401, { code: 'TOKEN_EXPIRED' });
    }
    return sendError(res, 'Invalid authentication token.', 401);
  }
};

export const optionalAuthenticate = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id);
      if (user && !user.isBlocked) {
        req.user = user;
      }
    }
  } catch (error) {
    // For optional auth, continue without setting req.user
  }
  next();
};

