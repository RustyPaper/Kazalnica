import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import eventsRoutes from './routes/events';
import permissionsRoutes from './routes/permissions';
import settingsRoutes from './routes/settings';
import statisticsRoutes from './routes/statistics';
import publicApartmentsRouter from './routes/publicApartments';
import apartmentsRoutes from './routes/apartments';
import backupRoutes from './routes/backup';
import { initDatabase } from './utils/initDatabase';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('🌐 Configured CORS for:', FRONTEND_URL);

// ============= CORS - POPRAWIONA KONFIGURACJA =============
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://kazalnicaapp.onrender.com',
  FRONTEND_URL
].filter(Boolean); // Usuń duplikaty i undefined

app.use(cors({
  origin: function (origin, callback) {
    // Pozwól na requesty bez origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('⚠️  CORS blocked origin:', origin);
      // W development pozwalaj wszystkim, w production blokuj
      if (process.env.NODE_ENV === 'production') {
        callback(new Error('Not allowed by CORS'));
      } else {
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24h cache dla preflight requests
}));

// ⭐ WAŻNE: Obsłuż OPTIONS requests explicite
app.options('*', cors());

// ============= BODY PARSERS =============
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Alternatywnie możesz użyć express.json()
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============= REQUEST LOGGING (opcjonalne, pomocne przy debugowaniu) =============
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
      origin: req.headers.origin,
      contentType: req.headers['content-type']
    });
    next();
  });
}

// ============= API ROUTES =============
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/public-apartments', publicApartmentsRouter);
app.use('/api/apartments', apartmentsRoutes);
app.use('/api/backup', backupRoutes);

// ============= HEALTH CHECK =============
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cors: allowedOrigins,
    database: 'PostgreSQL (Supabase)',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============= CORS TEST ENDPOINT (usuń w produkcji) =============
app.get('/api/test-cors', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    allowedOrigins: allowedOrigins
  });
});

// ============= FRONTEND W PRODUKCJI =============
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  
  // Serwuj statyczne pliki
  app.use(express.static(frontendPath, {
    maxAge: '1d', // Cache static files for 1 day
    etag: true
  }));
  
  // Wszystkie nieznane ścieżki (nie-API) → index.html (dla Vue Router)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ============= ERROR HANDLING =============
// 404 handler dla API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err);
  
  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      origin: req.headers.origin
    });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ============= GRACEFUL SHUTDOWN =============
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Otrzymano sygnał ${signal}, zamykanie serwera...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============= START SERVER =============
const startServer = async () => {
  try {
    await initDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║  🏢 Kalendarz Apartamentów - Server                    ║
╠════════════════════════════════════════════════════════╣
║  ✅ Status: Running                                    ║
║  🌐 Port: ${PORT.toString().padEnd(43)}║
║  🎨 Frontend: ${FRONTEND_URL.padEnd(38)}║
║  🗄️  Database: PostgreSQL (Supabase)                   ║
║  🔧 Environment: ${(process.env.NODE_ENV || 'development').padEnd(34)}║
║  🌍 CORS Origins: ${allowedOrigins.length} configured${' '.repeat(22)}║
╚════════════════════════════════════════════════════════╝

📍 Endpoints:
   • Health check: http://localhost:${PORT}/api/health
   • CORS test:    http://localhost:${PORT}/api/test-cors
   • API base:     http://localhost:${PORT}/api
      `);
    });
  } catch (error) {
    console.error('❌ Nie udało się uruchomić serwera:', error);
    process.exit(1);
  }
};

startServer();
