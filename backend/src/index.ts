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

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173'],
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
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Kalendarz Apartamentów - Server                       ║
╠════════════════════════════════════════════════════════╣
║  Status: Running                                       ║
║  Port: ${PORT}                                         ║
║  Environment: ${process.env.NODE_ENV || 'development'} ║
╚════════════════════════════════════════════════════════╝
  `);
});
