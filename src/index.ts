import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './config/logger';
import connectDatabase from './config/database';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors(config.cors));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// Static files
app.use('/uploads', express.static('uploads'));

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Mercor Time Tracking API',
    version: '1.0.0',
    documentation: '/api/v1/health',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
let server: any = null;
const startServer = async () => {
  let dbConnected = false;
  try {
    // Attempt to connect to database. If it fails we'll run in degraded mode.
    await connectDatabase();
    dbConnected = true;
    app.locals.dbConnected = true;
    logger.info('Database connection established');
  } catch (dbError) {
    // Don't exit; allow the HTTP server to start so the API can respond with
    // structured JSON errors instead of the process terminating and leaving
    // the client with an empty response.
    logger.error('Database connection failed during startup, running in degraded mode', dbError);
    app.locals.dbConnected = false;
  }

  // Start server (even if DB is down) so health checks and error responses work
  server = app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`API Base URL: ${config.apiBaseUrl}`);
    logger.info(`DB connected: ${app.locals.dbConnected ? 'yes' : 'no'}`);
  });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  // Do not exit on uncaught startup errors here to give operators time to
  // diagnose and allow the process to remain reachable.
};

// Handle uncaught exceptions - attempt graceful shutdown rather than immediate exit
process.on('uncaughtException', async (error) => {
  logger.error('Uncaught Exception:', error);
  try {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      logger.info('Server closed after uncaught exception');
    }
  } catch (closeErr) {
    logger.error('Error during server close after uncaught exception', closeErr);
  } finally {
    // Still exit to avoid running in an unknown state
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  try {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      logger.info('Server closed after unhandled rejection');
    }
  } catch (closeErr) {
    logger.error('Error during server close after unhandled rejection', closeErr);
  } finally {
    process.exit(1);
  }
});

// Start the server
startServer();

export default app;
