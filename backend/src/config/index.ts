import { config } from 'dotenv';

config();

export const environment = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // Clerk
  clerkSecretKey: process.env.CLERK_SECRET_KEY,
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  
  // API Configuration
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
};

export const isDevelopment = environment.nodeEnv === 'development';
export const isProduction = environment.nodeEnv === 'production';
export const isTest = environment.nodeEnv === 'test';
