import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest, Event } from '../types';
// STARE: import { readJSON, writeJSON } from '../utils/fileStorage';
// NOWE:
import { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent } from '../utils/databaseStorage';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { getPolishHolidays } from '../utils/holidays';

const router = express.Router();

// Get holidays for a year
router.get('/holidays/:year', authenticateToken, requirePermission('viewCalendar'), (req: AuthRequest, res: Response) => {
  const year = parseInt(req.params.year);
  
  if (isNaN(year) || year < 2000 || year > 2100) {
    return res.status(400).json({ error: 'Nieprawidłowy rok' });
  }
  
  const holidays = getPolishHolidays(year);
  res.json(holidays);
});

// Get all events
router.get('/', authenticateToken, requirePermission('viewCalendar'), async (req: AuthRequest, res: Response) => {
  try {
    const events = await getAllEvents();
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Create event
router.post('/', authenticateToken, requirePermission('addEvent'), async (req: AuthRequest, res: Response) => {
  try {
    const { date, apartmentNumber, description } = req.body;

    if (!date || !apartmentNumber) {
      return res.status(400).json({ error: 'Data i numer apartamentu są wymagane' });
    }

    const newEvent: Event = {
      id: uuidv4(),
      date,
      apartmentNumber,
      description,
      createdBy: req.user!.id,
      createdAt: new Date().toISOString()
    };

    const createdEvent = await createEvent(newEvent);
    res.status(201).json(createdEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Delete event
router.delete('/:eventId', authenticateToken, requirePermission('deleteEvent'), async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await getEventById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
    }

    await deleteEvent(eventId);
    res.json({ message: 'Wydarzenie usunięte' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Update event
router.put('/:eventId', authenticateToken, requirePermission('addEvent'), async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const { date, apartmentNumber, description } = req.body;

    const event = await getEventById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
    }

    // Check if user created the event or is admin
    const isAdmin = req.user!.role === 'admin';
    const isOwner = event.createdBy === req.user!.id;
    
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
