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

// ⭐ HELPER: Formatowanie daty do YYYY-MM-DD
const formatDate = (date: any): string | null => {
  if (!date) return null;
  
  try {
    // Jeśli to już string w formacie YYYY-MM-DD
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Jeśli to timestamp lub inny format
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    // Formatuj do YYYY-MM-DD (lokalna strefa czasowa)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('❌ Error formatting date:', error);
    return null;
  }
};

// ⭐ HELPER: Formatowanie apartamentu (daty do prawidłowego formatu)
const formatApartmentDates = (apt: PublicApartment): PublicApartment => {
  return {
    ...apt,
    collectionDate: apt.collectionDate ? formatDate(apt.collectionDate) : null
  };
};

// Rate limiter dla edycji publicznych lokali
const editLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 20, // max 20 edycji na IP w ciągu 15 minut
  message: { error: 'Zbyt wiele edycji. Spróbuj ponownie za 15 minut lub zaloguj się.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: any) => {
    const authHeader = req.headers['authorization'];
    return !!authHeader;
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

// ============= GET - Pobierz wszystkie publiczne lokale =============
router.get('/', async (_req: Request, res: Response) => {
  try {
    const apartments = await getAllPublicApartments();
    
    // ⭐ Formatuj daty w każdym rekordzie
    const formattedApartments = apartments.map(formatApartmentDates);
    
    res.json(formattedApartments);
  } catch (error) {
    console.error('❌ Błąd pobierania lokali:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============= POST - Dodaj nowy publiczny lokal =============
router.post('/', createLimiter, async (req: Request, res: Response) => {
  try {
    const data = req.body as Omit<PublicApartment, 'id' | 'createdAt'>;
    
    if (!data.apartmentNumber) {
      return res.status(400).json({ error: 'Numer lokalu jest wymagany' });
    }
    
    // ⭐ Formatuj datę przed zapisem
    if (data.collectionDate) {
      data.collectionDate = formatDate(data.collectionDate);
    }
    
    // Sprawdź duplikaty
    const apartmentNumber = data.apartmentNumber.trim().toUpperCase();
    
    const allPublic = await getAllPublicApartments();
    const publicDuplicate = allPublic.find(
      apt => apt.apartmentNumber.trim().toUpperCase() === apartmentNumber
    );
    
    if (publicDuplicate) {
      return res.status(400).json({ 
        error: `Lokal ${data.apartmentNumber} już istnieje na liście publicznej. Możesz go edytować zamiast dodawać ponownie.`,
        existingId: publicDuplicate.id
      });
    }
    
    // Sprawdź w lokalach użytkowników
    const { getAllUsers } = await import('../utils/databaseStorage');
    const allUsers = await getAllUsers();
    
    for (const user of allUsers) {
      const userDuplicate = user.apartments.find(
        apt => apt.number.trim().toUpperCase() === apartmentNumber
      );
      
      if (userDuplicate) {
        return res.status(400).json({ 
          error: `Lokal ${data.apartmentNumber} jest już przypisany do użytkownika: ${user.firstName} ${user.lastName || ''}`
        });
      }
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    
    console.log(`➕ Nowy publiczny lokal: ${data.apartmentNumber} z IP: ${ip}`);
    
    const apt = await createPublicApartment(data);
    
    // ⭐ Formatuj datę w odpowiedzi
    res.status(201).json(formatApartmentDates(apt));
  } catch (error) {
    console.error('❌ Błąd dodawania lokalu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============= PUT - Edytuj publiczny lokal =============
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

    // Sprawdź czy użytkownik jest adminem
    const authHeader = req.headers['authorization'];
    let isAdmin = false;
    let editedBy = 'anonymous';
    
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
        editedBy = `user:${decoded.login}`;
      } catch (err) {
        isAdmin = false;
        editedBy = 'anonymous';
      }
    }

    // 🔒 Jeśli zablokowany i nie admin - odrzuć
    if (oldApartment.isLocked && !isAdmin) {
      return res.status(403).json({ 
        error: '🔒 Ten lokal jest zablokowany i może być edytowany tylko przez administratora.' 
      });
    }
    
    const updates = req.body as Partial<PublicApartment>;
    
    // ⭐ Formatuj datę przed zapisem
    if (updates.collectionDate !== undefined) {
      updates.collectionDate = formatDate(updates.collectionDate);
    }
    
    // Identyfikacja edytującego
    const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'] || 'unknown';
    
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
    
    // ⭐ Formatuj datę w odpowiedzi
    res.json(formatApartmentDates(apt));
  } catch (error) {
    console.error('❌ Błąd edycji publicznego lokalu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============= GET - Pobierz jeden lokal po ID =============
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Nieprawidłowe ID' });
    }
    
    const apt = await getPublicApartmentById(id);
    
    if (!apt) {
      return res.status(404).json({ error: 'Lokal nie znaleziony' });
    }
    
    // ⭐ Formatuj datę w odpowiedzi
    res.json(formatApartmentDates(apt));
  } catch (error) {
    console.error('❌ Błąd pobierania lokalu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============= GET - Historia edycji lokalu (admin) =============
router.get('/:id/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Nieprawidłowe ID' });
    }
    
    const history = await getApartmentEditHistory(id);
    
    // ⭐ Formatuj daty w historii
    const formattedHistory = history.map(entry => ({
      ...entry,
      changes: {
        ...entry.changes,
        collectionDate: entry.changes.collectionDate 
          ? formatDate(entry.changes.collectionDate) 
          : undefined
      },
      oldValues: {
        ...entry.oldValues,
        collectionDate: entry.oldValues.collectionDate 
          ? formatDate(entry.oldValues.collectionDate) 
          : undefined
      }
    }));
    
    res.json(formattedHistory);
  } catch (error) {
    console.error('❌ Błąd pobierania historii:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============= PUT - Lock/Unlock lokalu (admin) =============
router.put('/:id/lock', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
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

    // ⭐ Formatuj datę w odpowiedzi
    res.json(formatApartmentDates(apt));
  } catch (error) {
    console.error('❌ Błąd lockowania:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
