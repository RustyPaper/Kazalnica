import express, { Response } from 'express';
import { AuthRequest, SystemSettings } from '../types';
import { readJSON, writeJSON } from '../utils/fileStorage';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get system settings
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    let settings = readJSON<SystemSettings>('settings.json');
    
    if (!settings || typeof settings.totalSharesTarget === 'undefined') {
      settings = { totalSharesTarget: 10000 };
      writeJSON('settings.json', settings);
    }
    
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Update system settings (admin only)
router.put('/', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Tylko administrator może zmieniać ustawienia' });
  }

  try {
    const { totalSharesTarget } = req.body;

    if (typeof totalSharesTarget !== 'number' || totalSharesTarget <= 0) {
      return res.status(400).json({ error: 'Nieprawidłowa wartość sumy udziałów' });
    }

    const settings: SystemSettings = { totalSharesTarget };
    writeJSON('settings.json', settings);

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
