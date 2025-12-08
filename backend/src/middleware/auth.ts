import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, AuthRequest } from '../types';
import { getUserById } from '../utils/databaseStorage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token wymagany' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Pobierz użytkownika z bazy danych
    const user = await getUserById(decoded.id); // Zmienione z userId na id

    if (!user) {
      return res.status(403).json({ error: 'Użytkownik nie znaleziony' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Nieprawidłowy token' });
  }
};

export const requirePermission = (permission: keyof User['permissions']) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Nieautoryzowany' });
    }

    if (!req.user.permissions[permission] && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    next();
  };
};

export { JWT_SECRET };
