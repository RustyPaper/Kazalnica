import express, { Response, Request } from 'express';
import { AuthRequest } from '../types';
import { getSetting, setSetting } from '../utils/databaseStorage';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all settings - PUBLICZNE (bez authenticateToken)
router.get('/', async (req: Request, res: Response) => {
  try {
    const totalSharesTarget = await getSetting('totalSharesTarget') || 10000;
    
    res.json({
      totalSharesTarget
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Get setting - PUBLICZNE
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const value = await getSetting(key);
    
    if (value === null) {
      return res.status(404).json({ error: 'Ustawienie nie znalezione' });
    }

    res.json({ key, value });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Update settings (admin only) - CHRONIONE
router.put('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    const { totalSharesTarget } = req.body;

    if (totalSharesTarget !== undefined) {
      await setSetting('totalSharesTarget', totalSharesTarget);
    }

    res.json({ 
      message: 'Ustawienia zaktualizowane',
      totalSharesTarget 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Set setting (admin only) - CHRONIONE
router.put('/:key', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Wartość jest wymagana' });
    }

    await setSetting(key, value);
    res.json({ key, value });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
