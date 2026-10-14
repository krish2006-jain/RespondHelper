import mongoose from 'mongoose';
import { ENV } from './env.js';
import { logger } from '../utils/logger.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI, {
      dbName: ENV.MONGO_DB_NAME,
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    throw new Error(
      'MongoDB is unavailable. Check MONGO_URI, Atlas DNS/network access, and that the database is running.'
    );
  }
};
