import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Błąd walidacji danych',
      details: err.message,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Brak autoryzacji',
    });
  }

  res.status(500).json({
    error: 'Błąd serwera',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
