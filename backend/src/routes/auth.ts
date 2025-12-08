import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../types';
import { JWT_SECRET } from '../config/jwt';
// STARE: import { readJSON, writeJSON } from '../utils/fileStorage';
// NOWE:
import { getAllUsers, getUserByLogin, createUser } from '../utils/databaseStorage';

const router = express.Router();

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Login i hasło są wymagane' });
    }

    const user = await getUserByLogin(login);

    if (!user) {
      return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
    }

    const token = jwt.sign(
      { id: user.id, login: user.login, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { login, password, firstName, lastName, phoneNumber, email } = req.body;

    if (!login || !password || !firstName) {
      return res.status(400).json({ error: 'Login, hasło i imię są wymagane' });
    }

    const existingUser = await getUserByLogin(login);

       if (existingUser) {
      return res.status(400).json({ error: 'Użytkownik o tym loginie już istnieje' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
      id: uuidv4(),
      login,
      password: hashedPassword,
      firstName,
      lastName: lastName || '',
      apartments: [],
      role: 'user',
      permissions: {
        viewCalendar: true,
        addEvent: false,
        deleteEvent: false
      },
      phoneNumber: phoneNumber || '',
      email: email || ''
    };

    await createUser(newUser);

    const token = jwt.sign(
      { id: newUser.id, login: newUser.login, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;

