import express, { Response } from 'express';
import bcrypt from 'bcrypt';
import { AuthRequest, User } from '../types';
// STARE: import { readJSON, writeJSON } from '../utils/fileStorage';
// NOWE:
import { getAllUsers, getUserById, updateUser, deleteUser } from '../utils/databaseStorage';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
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

    const updates: Partial<User> = {};

    if (firstName) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;

    // Walidacja duplikatów
    if (apartments !== undefined) {
      // Sprawdź duplikaty w publicznych lokalach
      const { getAllPublicApartments } = await import('../utils/publicApartmentsStorage');
      const publicApartments = await getAllPublicApartments();
      
      for (const apt of apartments) {
        const duplicate = publicApartments.find(
          pub => pub.apartmentNumber.trim().toUpperCase() === apt.number.trim().toUpperCase()
        );
        
        if (duplicate) {
          return res.status(400).json({ 
            error: `Lokal ${apt.number} już istnieje na liście publicznej. Użyj funkcji "Przypisz do konta" zamiast dodawać ręcznie.` 
          });
        }
      }
      
      // Sprawdź duplikaty u innych użytkowników
      const allUsers = await getAllUsers();
      for (const apt of apartments) {
        for (const user of allUsers) {
          if (user.id === req.user!.id) continue; // Pomiń siebie
          
          const duplicate = user.apartments.find(
            userApt => userApt.number.trim().toUpperCase() === apt.number.trim().toUpperCase()
          );
          
          if (duplicate) {
            return res.status(400).json({ 
              error: `Lokal ${apt.number} jest już przypisany do użytkownika: ${user.firstName} ${user.lastName || ''} (${user.login})` 
            });
          }
        }
      }
      
      updates.apartments = apartments;
    }

    
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (email !== undefined) updates.email = email;

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await updateUser(req.user!.id, updates);

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

// Get all users (admin only)
router.get('/all', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    const users = await getAllUsers();
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Delete user (admin only)
router.delete('/:userId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user!.id) {
      return res.status(400).json({ error: 'Nie możesz usunąć własnego konta' });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    await deleteUser(userId);

    res.json({ 
      message: 'Użytkownik został usunięty',
      deletedUser: user.login
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
