import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, AuthRequest } from '../types';
import { readJSON } from '../utils/fileStorage';

const JWT_SECRET = 'your-secret-key-change-in-production';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token wymagany' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Nieprawidłowy token' });
    }

    const users = readJSON<User[]>('users.json');
    const user = users.find(u => u.id === (decoded as any).userId);

    if (!user) {
      return res.status(403).json({ error: 'Użytkownik nie znaleziony' });
    }

    req.user = user;
    next();
  });
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
