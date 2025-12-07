import express, { Response } from 'express';
import bcrypt from 'bcrypt';
import { AuthRequest, User } from '../types';
import { readJSON, writeJSON } from '../utils/fileStorage';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  const { password: _, ...userWithoutPassword } = req.user!;
  res.json(userWithoutPassword);
});

// Update profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      apartments,
      phoneNumber,
      email,
      password
    } = req.body;

    const users = readJSON<User[]>('users.json');
    const userIndex = users.findIndex(u => u.id === req.user!.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    const updatedUser = { ...users[userIndex] };

    if (firstName) updatedUser.firstName = firstName;
    if (lastName !== undefined) updatedUser.lastName = lastName;
    if (apartments) updatedUser.apartments = apartments;
    if (phoneNumber !== undefined) updatedUser.phoneNumber = phoneNumber;
    if (email !== undefined) updatedUser.email = email;

    if (password) {
      updatedUser.password = await bcrypt.hash(password, 10);
    }

    users[userIndex] = updatedUser;
    writeJSON('users.json', users);

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Get all users (admin only)
router.get('/all', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Brak uprawnień' });
  }

  const users = readJSON<User[]>('users.json');
  const usersWithoutPasswords = users.map(({ password, ...user }) => user);

  res.json(usersWithoutPasswords);
});

export default router;
