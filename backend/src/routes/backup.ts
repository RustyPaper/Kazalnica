import express, { Response } from 'express';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth';
import { createBackup, listBackups, restoreBackup } from '../utils/backup';

const router = express.Router();

// Admin only - create manual backup
router.post('/create', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Tylko administrator może tworzyć kopie zapasowe' });
  }

  try {
    const backupPath = createBackup();
    res.json({
      message: 'Kopia zapasowa utworzona',
      path: backupPath,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin only - list backups
router.get('/list', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Tylko administrator może przeglądać kopie zapasowe' });
  }

  try {
    const backups = listBackups();
    res.json(backups);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin only - restore backup
router.post('/restore/:backupName', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Tylko administrator może przywracać kopie zapasowe' });
  }

  try {
    const { backupName } = req.params;
    restoreBackup(backupName);
    res.json({ message: 'Kopia zapasowa przywrócona' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
