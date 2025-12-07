import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import eventsRoutes from './routes/events';
import permissionsRoutes from './routes/permissions';
import settingsRoutes from './routes/settings';
import statisticsRoutes from './routes/statistics';

const app = express();
const PORT = 3000;

// CORS - MUSI BYĆ PRZED INNYMI MIDDLEWARE
app.use(cors({
  origin: [
    'https://gamming.tail4ba063.ts.net',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// CSP Headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https://gamming.tail4ba063.ts.net http://localhost:*; " +
    "connect-src 'self' https://gamming.tail4ba063.ts.net http://localhost:* ws://localhost:* wss://*; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data:;"
  );
  next();
});

// Body parser
app.use(bodyParser.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} from ${req.get('origin')}`);
  next();
});

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
║  Port: ${PORT}                                              ║
║  Local: http://localhost:${PORT}                            ║
║  Tailscale: https://gamming.tail4ba063.ts.net/api      ║
╚════════════════════════════════════════════════════════╝
  `);
});
