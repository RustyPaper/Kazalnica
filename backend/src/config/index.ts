import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  dataPath: process.env.DATA_PATH || path.join(__dirname, '../../data'),
};
