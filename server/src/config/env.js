import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load server/.env and root .env regardless of working directory
dotenv.config({ path: path.resolve(__dirname, '../../../server/.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });


export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim()),

  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/disaster_platform',
  MONGO_DB_NAME: process.env.MONGO_DB_NAME || 'disaster_platform',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'disaster_jwt_access_secret_default_key',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'disaster_jwt_refresh_secret_default_key',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'cookie_secret_relief',

  ADMIN_NAME: process.env.ADMIN_NAME || 'Platform Admin',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@relief.org',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@12345',
  ADMIN_PHONE: process.env.ADMIN_PHONE || '+919876543210',

  UPLOAD_PROVIDER: process.env.UPLOAD_PROVIDER || 'local',
  LOCAL_UPLOAD_DIR: process.env.LOCAL_UPLOAD_DIR || 'uploads',

  MAP_DEFAULT_LAT: parseFloat(process.env.DEFAULT_MAP_LAT) || 19.0760,
  MAP_DEFAULT_LNG: parseFloat(process.env.DEFAULT_MAP_LNG) || 72.8777,
  MAP_DEFAULT_ZOOM: parseInt(process.env.DEFAULT_MAP_ZOOM, 10) || 11,

  MATCH_DEFAULT_RADIUS_KM: parseFloat(process.env.MATCH_DEFAULT_RADIUS_KM) || 25,
  MATCH_MAX_RADIUS_KM: parseFloat(process.env.MATCH_MAX_RADIUS_KM) || 100,
  MATCH_MAX_RESULTS: parseInt(process.env.MATCH_MAX_RESULTS, 10) || 5,

  RESOURCE_WEIGHTS: {
    urgency: parseFloat(process.env.RESOURCE_WEIGHT_URGENCY) || 0.30,
    distance: parseFloat(process.env.RESOURCE_WEIGHT_DISTANCE) || 0.30,
    quantity: parseFloat(process.env.RESOURCE_WEIGHT_QUANTITY) || 0.25,
    availability: parseFloat(process.env.RESOURCE_WEIGHT_AVAILABILITY) || 0.15,
  },

  VOLUNTEER_WEIGHTS: {
    distance: parseFloat(process.env.VOLUNTEER_WEIGHT_DISTANCE) || 0.30,
    skill: parseFloat(process.env.VOLUNTEER_WEIGHT_SKILL) || 0.25,
    priority: parseFloat(process.env.VOLUNTEER_WEIGHT_PRIORITY) || 0.20,
    availability: parseFloat(process.env.VOLUNTEER_WEIGHT_AVAILABILITY) || 0.15,
    workload: parseFloat(process.env.VOLUNTEER_WEIGHT_WORKLOAD) || 0.10,
  },
  VOLUNTEER_MAX_ACTIVE_TASKS: parseInt(process.env.VOLUNTEER_MAX_ACTIVE_TASKS, 10) || 2,

  LOW_STOCK_THRESHOLD_PERCENT: parseInt(process.env.LOW_STOCK_THRESHOLD_PERCENT, 10) || 20,
  EXPIRING_SOON_DAYS: parseInt(process.env.EXPIRING_SOON_DAYS, 10) || 7,
  INVENTORY_CRON_SCHEDULE: process.env.INVENTORY_CRON_SCHEDULE || '0 * * * *',

  RATE_LIMIT_WINDOW_MIN: parseInt(process.env.RATE_LIMIT_WINDOW_MIN, 10) || 15,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 1000,
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 30,
  SOS_RATE_LIMIT_MAX: parseInt(process.env.SOS_RATE_LIMIT_MAX, 10) || 30,
  ACCOUNT_LOCK_MAX_ATTEMPTS: parseInt(process.env.ACCOUNT_LOCK_MAX_ATTEMPTS, 10) || 5,
  ACCOUNT_LOCK_MINUTES: parseInt(process.env.ACCOUNT_LOCK_MINUTES, 10) || 15,
};
