import express, { Response } from 'express';
import { AuthRequest, PublicApartment } from '../types';
import { 
  getAllPublicApartments,
  createPublicApartment,
  updatePublicApartment,
  getPublicApartmentById
} from '../utils/publicApartmentsStorage';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Pobierz wszystkie publiczne lokale (dla statystyk i podglądu)
router.get('/', async (req, res: Response) => {
  const apartments = await getAllPublicApartments();
  res.json(apartments);
});

// Dodaj nowy publiczny lokal
router.post('/', async (req, res: Response) => {
  const data = req.body as Omit<PublicApartment, 'id' | 'createdAt'>;
  // apartmentNumber wymagany!
  if (!data.apartmentNumber) {
    return res.status(400).json({ error: 'Numer lokalu jest wymagany' });
  }
  const apt = await createPublicApartment(data);
  res.status(201).json(apt);
});

// Edytuj wpis (wymagane logowanie i uprawnienie canEditPublicApartments)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (!req.user?.permissions.canEditPublicApartments && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Brak uprawnień do edycji lokali publicznych.' });
  }
  const updates = req.body as Partial<PublicApartment>;
  const apt = await updatePublicApartment(id, updates);
  if (!apt) {
    return res.status(404).json({ error: 'Lokal nie znaleziony' });
  }
  res.json(apt);
});

export default router;
