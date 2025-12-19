import express, { Response, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { AuthRequest, Event } from '../types';
import { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent } from '../utils/databaseStorage';
import { authenticateToken, requirePermission, JWT_SECRET } from '../middleware/auth';
import { getPolishHolidays } from '../utils/holidays';
import { ANONYMOUS_USER_ID } from '../utils/migrations/createAnonymousUser'; // 🆕 DODANE

const router = express.Router();

// Get holidays for a year - PUBLICZNE
router.get('/holidays/:year', (req: Request, res: Response) => {
  const year = parseInt(req.params.year);
  
  if (isNaN(year) || year < 2000 || year > 2100) {
    return res.status(400).json({ error: 'Nieprawidłowy rok' });
  }
  
  const holidays = getPolishHolidays(year);
  res.json(holidays);
});

// Get all events - PUBLICZNE
router.get('/', async (req: Request, res: Response) => {
  try {
    const events = await getAllEvents();
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Create event - PUBLICZNE (każdy może dodać)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { date, apartmentNumber, description } = req.body;

    if (!date || !apartmentNumber) {
      return res.status(400).json({ error: 'Data i numer lokalu są wymagane' });
    }

    // Sprawdź czy użytkownik jest zalogowany (opcjonalnie)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    let createdBy = ANONYMOUS_USER_ID; // 🆕 ZMIENIONE: Użyj UUID użytkownika Anonymous
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        createdBy = decoded.id; // Jeśli zalogowany, użyj ID użytkownika
        console.log('✅ Wydarzenie tworzone przez zalogowanego:', decoded.login);
      } catch (err) {
        // Token nieprawidłowy, pozostaw jako Anonymous
        console.log('⚠️ Token nieprawidłowy, tworzę jako Anonymous');
      }
    } else {
      console.log('📝 Wydarzenie tworzone przez anonima');
    }

    const newEvent: Event = {
      id: uuidv4(),
      date,
      apartmentNumber,
      description: description || '',
      createdBy,
      createdAt: new Date().toISOString()
    };

    const createdEvent = await createEvent(newEvent);
    res.status(201).json(createdEvent);
  } catch (error) {
    console.error('❌ Błąd tworzenia wydarzenia:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Delete event - CHRONIONE (tylko zalogowani z uprawnieniem)
router.delete('/:eventId', authenticateToken, requirePermission('deleteEvent'), async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await getEventById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
    }

    // Admin może usuwać wszystko, user tylko swoje
    const isAdmin = req.user!.role === 'admin';
    const isOwner = event.createdBy === req.user!.id;
    
    // 🆕 DODANE: Nie można usunąć wydarzenia anonimowego jako zwykły user
    if (event.createdBy === ANONYMOUS_USER_ID && !isAdmin) {
      return res.status(403).json({ error: 'Tylko administrator może usuwać anonimowe wydarzenia' });
    }
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Możesz usuwać tylko swoje wydarzenia' });
    }

    await deleteEvent(eventId);
    res.json({ message: 'Wydarzenie usunięte' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Update event - CHRONIONE (tylko zalogowani z uprawnieniem)
router.put('/:eventId', authenticateToken, requirePermission('addEvent'), async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const { date, apartmentNumber, description } = req.body;

    const event = await getEventById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
    }

    // Sprawdź czy użytkownik stworzył wydarzenie lub jest adminem
    const isAdmin = req.user!.role === 'admin';
    const isOwner = event.createdBy === req.user!.id;
    
    // 🆕 DODANE: Nie można edytować wydarzenia anonimowego jako zwykły user
    if (event.createdBy === ANONYMOUS_USER_ID && !isAdmin) {
      return res.status(403).json({ error: 'Tylko administrator może edytować anonimowe wydarzenia' });
    }
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Brak uprawnień do edycji tego wydarzenia' });
    }

    const updates: Partial<Event> = {};
    if (date) updates.date = date;
    if (apartmentNumber) updates.apartmentNumber = apartmentNumber;
    if (description !== undefined) updates.description = description;

    const updatedEvent = await updateEvent(eventId, updates);
    res.json(updatedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
