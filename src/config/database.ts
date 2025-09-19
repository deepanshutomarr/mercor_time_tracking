import mongoose from 'mongoose';
import { logger } from './logger';

const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mercor-time-tracking';
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    };

    await mongoose.connect(mongoUri, options);
    
    logger.info('MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    // Log the error but don't exit the process here.
    // Let the caller decide how to proceed so the HTTP server can still start
    // in a degraded mode (returns JSON errors instead of no response).
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

export default connectDatabase;
