import express, { Response, Request } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthRequest, PublicApartment } from '../types';
import {
  getAllPublicApartments,
  createPublicApartment,
  updatePublicApartment,
  getPublicApartmentById,
  logApartmentEdit,
  getApartmentEditHistory,
  toggleLockPublicApartment
} from '../utils/publicApartmentsStorage';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Rate limiter dla edycji publicznych lokali
const editLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 20, // max 20 edycji na IP w ciągu 15 minut
  message: { error: 'Zbyt wiele edycji. Spróbuj ponownie za 15 minut lub zaloguj się.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Nie licz requestów od zalogowanych użytkowników
  skip: (req: any) => {
    const authHeader = req.headers['authorization'];
    return !!authHeader; // Skip jeśli jest token
  }
});

// Rate limiter dla dodawania publicznych lokali
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Zbyt wiele nowych lokali. Spróbuj ponownie za 15 minut.' },
  skip: (req: any) => {
    const authHeader = req.headers['authorization'];
    return !!authHeader;
  }
});

// Pobierz wszystkie publiczne lokale
router.get('/', async (_req: Request, res: Response) => {
  try {
    const apartments = await getAllPublicApartments();
    res.json(apartments);
  } catch (error) {
    console.error('Błąd pobierania lokali:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Dodaj nowy publiczny lokal - z rate limiting
router.post('/', createLimiter, async (req: Request, res: Response) => {
  try {
    const data = req.body as Omit<PublicApartment, 'id' | 'createdAt'>;
    
    if (!data.apartmentNumber) {
      return res.status(400).json({ error: 'Numer lokalu jest wymagany' });
    }
    
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    
    console.log(`➕ Nowy publiczny lokal: ${data.apartmentNumber} z IP: ${ip}`);
    
    const apt = await createPublicApartment(data);
    res.status(201).json(apt);
  } catch (error) {
    console.error('Błąd dodawania lokalu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Edytuj wpis - PUBLICZNE z rate limiting i logowaniem
router.put('/:id', editLimiter, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Nieprawidłowe ID' });
    }
    
    // Pobierz stare wartości
    const oldApartment = await getPublicApartmentById(id);
    if (!oldApartment) {
      return res.status(404).json({ error: 'Lokal nie znaleziony' });
    }

    // 🆕 SPRAWDŹ CZY ZABLOKOWANY
    const authHeader = req.headers['authorization'];
    let isAdmin = false;
    
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        // Sprawdź czy admin
        const { getUserById } = require('../utils/databaseStorage');
        const user = await getUserById(decoded.id);
        isAdmin = user?.role === 'admin';
      } catch (err) {
        isAdmin = false;
      }
    }

    // Jeśli zablokowany i nie admin - odrzuć
    if (oldApartment.isLocked && !isAdmin) {
      return res.status(403).json({ 
        error: '🔒 Ten lokal jest zablokowany i może być edytowany tylko przez administratora.' 
      });
    }
    
    const updates = req.body as Partial<PublicApartment>;
    
    // Identyfikacja edytującego
    const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    let editedBy = 'anonymous';
    
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        editedBy = `user:${decoded.login}`;
      } catch (err) {
        editedBy = 'anonymous';
      }
    }
    
    // Aktualizuj lokal
    const apt = await updatePublicApartment(id, updates);
    
    if (!apt) {
      return res.status(404).json({ error: 'Lokal nie znaleziony' });
    }
    
    // Zapisz historię edycji
    await logApartmentEdit(
      id,
      updates,
      {
        apartmentNumber: oldApartment.apartmentNumber,
        ownerFirstName: oldApartment.ownerFirstName,
        ownerLastName: oldApartment.ownerLastName,
        phoneNumber: oldApartment.phoneNumber,
        email: oldApartment.email,
        shareAmount: oldApartment.shareAmount,
        status: oldApartment.status,
        collectionDate: oldApartment.collectionDate,
        additionalInfo: oldApartment.additionalInfo
      },
      editedBy,
      ip,
      userAgent
    );
    
    console.log(`✏️ Edycja lokalu #${id} przez ${editedBy} (IP: ${ip})`);
    
    res.json(apt);
  } catch (error) {
    console.error('Błąd edycji publicznego lokalu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});


// Pobierz historię edycji lokalu (opcjonalnie - dla admina)
router.get('/:id/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Tylko admin może przeglądać historię
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    
    const id = parseInt(req.params.id, 10);
    const history = await getApartmentEditHistory(id);
    
    res.json(history);
  } catch (error) {
    console.error('Błąd pobierania historii:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// 🔒 Toggle lock/unlock apartamentu (tylko admin)
router.put('/:id/lock', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Tylko admin może lockować
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Nieprawidłowe ID' });
    }

    const apt = await toggleLockPublicApartment(id);
    
    if (!apt) {
      return res.status(404).json({ error: 'Lokal nie znaleziony' });
    }

    console.log(`🔒 Lokal #${id} ${apt.isLocked ? 'ZABLOKOWANY' : 'ODBLOKOWANY'} przez ${req.user.login}`);

    res.json(apt);
  } catch (error) {
    console.error('Błąd lockowania:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
