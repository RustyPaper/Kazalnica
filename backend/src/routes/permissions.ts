import express, { Response } from 'express';
import { AuthRequest, User } from '../types';
import { readJSON, writeJSON } from '../utils/fileStorage';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Update user permissions (admin only)
router.put('/:userId', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Brak uprawnień' });
  }

  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    const users = readJSON<User[]>('users.json');
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    if (users[userIndex].role === 'admin' && req.user!.id !== userId) {
      return res.status(403).json({ error: 'Nie można modyfikować uprawnień admina' });
    }

    users[userIndex].permissions = {
      ...users[userIndex].permissions,
      ...permissions
    };

    writeJSON('users.json', users);

    const { password: _, ...userWithoutPassword } = users[userIndex];

    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
