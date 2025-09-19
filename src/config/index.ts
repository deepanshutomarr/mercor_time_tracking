import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mercor-time-tracking',
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Email Configuration
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@mercor.com'
  },
  
  // API Configuration
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
  webAppUrl: process.env.WEB_APP_URL || 'http://localhost:3001',
  desktopAppUrl: process.env.DESKTOP_APP_URL || 'http://localhost:3002',
  
  // Screenshot Configuration
  screenshot: {
    interval: parseInt(process.env.SCREENSHOT_INTERVAL || '300000', 10), // 5 minutes
    quality: parseInt(process.env.SCREENSHOT_QUALITY || '80', 10),
    maxSize: process.env.SCREENSHOT_MAX_SIZE || '1920x1080',
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },
  
  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  
  // CORS
  cors: {
    origin: [
      process.env.WEB_APP_URL || 'http://localhost:3001',
      process.env.DESKTOP_APP_URL || 'http://localhost:3002'
    ],
    credentials: true
  }
};

export default config;
