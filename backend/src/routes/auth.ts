import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../types';
import { readJSON, writeJSON } from '../utils/fileStorage';

const router = express.Router();
const JWT_SECRET = 'your-secret-key-change-in-production';

// Initialize with hardcoded admin
const initializeAdmin = () => {
  let users = readJSON<User[]>('users.json');
  
  if (!Array.isArray(users)) {
    users = [];
  }

  const adminExists = users.some(u => u.role === 'admin');
  
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const admin: User = {
      id: uuidv4(),
      login: 'admin',
      password: hashedPassword,
      firstName: 'Administrator',
      lastName: 'System',
      apartments: [],
      role: 'admin',
      permissions: {
        viewCalendar: true,
        addEvent: true,
        deleteEvent: true,
      }
    };
    users.push(admin);
    writeJSON('users.json', users);
    console.log('✓ Admin account created - Login: admin, Password: admin123');
  }
};

initializeAdmin();

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      login,
      password,
      firstName,
      lastName,
      apartments,
      phoneNumber,
      email
    } = req.body;

    if (!login || !password || !firstName || !apartments || apartments.length === 0) {
      return res.status(400).json({ error: 'Wypełnij wszystkie wymagane pola' });
    }

    const users = readJSON<User[]>('users.json');

    if (users.some(u => u.login.toLowerCase() === login.toLowerCase())) {
      return res.status(400).json({ error: 'Login już istnieje' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
      id: uuidv4(),
      login,
      password: hashedPassword,
      firstName,
      lastName,
      apartments,
      phoneNumber,
      email,
      role: 'user',
      permissions: {
        viewCalendar: true,
        addEvent: true,
        deleteEvent: false,
      }
    };

    users.push(newUser);
    writeJSON('users.json', users);

    const token = jwt.sign(
      { userId: newUser.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Login i hasło są wymagane' });
    }

    const users = readJSON<User[]>('users.json');
    const user = users.find(u => u.login.toLowerCase() === login.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
    }

    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
export { JWT_SECRET };
