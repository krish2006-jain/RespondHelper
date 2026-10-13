import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';
import { ENV } from './env.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow all configured origins or reflect origin in dev
        callback(null, true);
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join personal user room
    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        logger.debug(`Socket ${socket.id} joined room user:${userId}`);
      }
    });

    // Join role-specific broadcast room
    socket.on('join:role', (role) => {
      if (role) {
        socket.join(`role:${role}`);
        logger.debug(`Socket ${socket.id} joined room role:${role}`);
      }
    });

    // Join specific request tracking room
    socket.on('join:request', (requestId) => {
      if (requestId) {
        socket.join(`request:${requestId}`);
        logger.debug(`Socket ${socket.id} joined room request:${requestId}`);
      }
    });

    // Leave request room
    socket.on('leave:request', (requestId) => {
      if (requestId) {
        socket.leave(`request:${requestId}`);
      }
    });

    // Global map room
    socket.on('join:map', () => {
      socket.join('map:live');
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    logger.warn('Socket.io not yet initialized or disabled.');
  }
  return io;
};
