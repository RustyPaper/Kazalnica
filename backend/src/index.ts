import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import eventsRoutes from './routes/events';
import permissionsRoutes from './routes/permissions';
import settingsRoutes from './routes/settings';
import statisticsRoutes from './routes/statistics';
// NOWE:
import { initDatabase } from './utils/initDatabase';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('🌐 Configured CORS for:', FRONTEND_URL);

// CORS - MUSI BYĆ PRZED ROUTES
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'https://kazalnicaapp.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/statistics', statisticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cors: FRONTEND_URL,
    database: 'PostgreSQL'
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database tables
    await initDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║  Kalendarz Apartamentów - Server                       ║
╠════════════════════════════════════════════════════════╣
║  Status: Running                                       ║
║  Port: ${PORT}                                         ║
║  Frontend: ${FRONTEND_URL}                             ║
║  Database: PostgreSQL                                  ║
║  Environment: ${process.env.NODE_ENV || 'development'} ║
╚════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Nie udało się uruchomić serwera:', error);
    process.exit(1);
  }
};

startServer();

