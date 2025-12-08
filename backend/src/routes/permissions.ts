import express, { Response } from 'express';
import { AuthRequest } from '../types';
// STARE: import { readJSON, writeJSON } from '../utils/fileStorage';
// NOWE:
import { getUserById, updateUser } from '../utils/databaseStorage';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Update user permissions (admin only)
router.put('/:userId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    const { userId } = req.params;
    const { permissions } = req.body;

    if (!permissions) {
      return res.status(400).json({ error: 'Uprawnienia są wymagane' });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    const updatedUser = await updateUser(userId, { permissions });

    if (!updatedUser) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
