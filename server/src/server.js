import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { startInventoryJob } from './services/inventoryJob.js';
import { standardLimiter } from './middleware/rateLimitMiddleware.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { logger } from './utils/logger.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import shelterRoutes from './routes/shelterRoutes.js';
import mapRoutes from './routes/mapRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Security & Utility Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost Vite dev server and configured origins
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads (photos, videos, verification documents)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Apply standard rate limiter to API routes
app.use(ENV.API_PREFIX, standardLimiter);

// API Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString(), app: 'Relief Network API' });
});

// Root & API Information / Redirection Routes
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.redirect(ENV.CLIENT_URL);
  }
  return res.json({
    status: 'ok',
    app: 'Disaster Management & Emergency Response Platform API',
    clientUrl: ENV.CLIENT_URL,
    apiPrefix: ENV.API_PREFIX,
  });
});

app.get('/api', (req, res) => {
  res.redirect(ENV.API_PREFIX);
});

app.get(ENV.API_PREFIX, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Disaster Management API (v1) is active',
    clientUrl: ENV.CLIENT_URL,
    health: '/health',
  });
});

// Mount Routes
app.use(`${ENV.API_PREFIX}/auth`, authRoutes);
app.use(`${ENV.API_PREFIX}/requests`, requestRoutes);
app.use(`${ENV.API_PREFIX}/volunteers`, volunteerRoutes);
app.use(`${ENV.API_PREFIX}/resources`, resourceRoutes);
app.use(`${ENV.API_PREFIX}/shelters`, shelterRoutes);
app.use(`${ENV.API_PREFIX}/map`, mapRoutes);
app.use(`${ENV.API_PREFIX}/verification`, verificationRoutes);
app.use(`${ENV.API_PREFIX}/notifications`, notificationRoutes);
app.use(`${ENV.API_PREFIX}/admin`, adminRoutes);

// Catch-all 404 for unmatched backend routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use(errorHandler);


// Start Server & Connect Database
const startServer = async () => {
  try {
    await connectDB();
    startInventoryJob();

    server.listen(ENV.PORT, () => {
      logger.info(`====================================================`);
      logger.info(`🚀 Disaster Management API running on port ${ENV.PORT}`);
      logger.info(`📍 Base URL: http://localhost:${ENV.PORT}${ENV.API_PREFIX}`);
      logger.info(`📁 Uploads available at: http://localhost:${ENV.PORT}/uploads`);
      logger.info(`====================================================`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
  }
};

startServer();

export { app, server };
