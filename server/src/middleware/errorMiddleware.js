import { logger } from '../utils/logger.js';
import { sendError } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} - Error: ${err.message}`, err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return sendError(res, 'Validation failed', 400, errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, `A record with this ${field} already exists.`, 409);
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authorization token.', 401);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 'Uploaded file exceeds the maximum allowed size (25MB).', 400);
  }

  const statusCode = err.statusCode || (res.statusCode !== 200 && res.statusCode !== 201 ? res.statusCode : 500);
  const message = process.env.NODE_ENV === 'production' && statusCode === 500 ? 'Internal server error' : err.message;

  return sendError(res, message, statusCode);
};
