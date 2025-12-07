import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest, Event } from '../types';
import { readJSON, writeJSON } from '../utils/fileStorage';
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
router.get('/', authenticateToken, requirePermission('viewCalendar'), (req: AuthRequest, res: Response) => {
  const events = readJSON<Event[]>('events.json');
  res.json(events);
});

// Create event
router.post('/', authenticateToken, requirePermission('addEvent'), (req: AuthRequest, res: Response) => {
  try {
    const { date, apartmentNumber, description } = req.body;

    if (!date || !apartmentNumber) {
      return res.status(400).json({ error: 'Data i numer apartamentu są wymagane' });
    }

    const events = readJSON<Event[]>('events.json');

    const newEvent: Event = {
      id: uuidv4(),
      date,
      apartmentNumber,
      description,
      createdBy: req.user!.id,
      createdAt: new Date().toISOString()
    };

    events.push(newEvent);
    writeJSON('events.json', events);

    res.status(201).json(newEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Delete event
router.delete('/:eventId', authenticateToken, requirePermission('deleteEvent'), (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    const events = readJSON<Event[]>('events.json');
    const eventIndex = events.findIndex(e => e.id === eventId);

    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
    }

    events.splice(eventIndex, 1);
    writeJSON('events.json', events);

    res.json({ message: 'Wydarzenie usunięte' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Update event
router.put('/:eventId', authenticateToken, requirePermission('addEvent'), (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const { date, apartmentNumber, description } = req.body;

    const events = readJSON<Event[]>('events.json');
    const eventIndex = events.findIndex(e => e.id === eventId);

    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
    }

    // Check if user created the event or is admin
    const isAdmin = req.user!.role === 'admin';
    const isOwner = events[eventIndex].createdBy === req.user!.id;
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Brak uprawnień do edycji tego wydarzenia' });
    }

    if (date) events[eventIndex].date = date;
    if (apartmentNumber) events[eventIndex].apartmentNumber = apartmentNumber;
    if (description !== undefined) events[eventIndex].description = description;

    writeJSON('events.json', events);

    res.json(events[eventIndex]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
