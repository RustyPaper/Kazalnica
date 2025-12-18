import express, { Response } from 'express';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth';
import { generateJsonBackup, generateSqlBackup, saveBackupToFile } from '../utils/backup';

const router = express.Router();

// Download JSON backup
router.get('/json', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Tylko admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    console.log(`📥 Admin ${req.user.login} pobiera backup JSON`);

    const backup = await generateJsonBackup();
    const filename = `calendar_backup_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(backup);

  } catch (error) {
    console.error('Błąd pobierania backupu JSON:', error);
    res.status(500).json({ error: 'Błąd tworzenia backupu' });
  }
});

// Download SQL backup
router.get('/sql', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Tylko admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    console.log(`📥 Admin ${req.user.login} pobiera backup SQL`);

    const backup = await generateSqlBackup();
    const filename = `calendar_backup_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.sql`;

    res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(backup);

  } catch (error) {
    console.error('Błąd pobierania backupu SQL:', error);
    res.status(500).json({ error: 'Błąd tworzenia backupu' });
  }
});

// Get backup info (metadata)
router.get('/info', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Tylko admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    const pool = require('../config/database').default;
    const client = await pool.connect();

    try {
      // Pobierz statystyki tabel
      const users = await client.query('SELECT COUNT(*) FROM users');
      const events = await client.query('SELECT COUNT(*) FROM events');
      const publicApts = await client.query('SELECT COUNT(*) FROM public_apartments');
      const history = await client.query('SELECT COUNT(*) FROM public_apartments_edit_history');
      const settings = await client.query('SELECT COUNT(*) FROM settings');

      // Rozmiar bazy danych (PostgreSQL)
      const dbSize = await client.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);

      res.json({
        timestamp: new Date().toISOString(),
        tables: {
          users: parseInt(users.rows[0].count),
          events: parseInt(events.rows[0].count),
          public_apartments: parseInt(publicApts.rows[0].count),
          edit_history: parseInt(history.rows[0].count),
          settings: parseInt(settings.rows[0].count)
        },
        database_size: dbSize.rows[0].size,
        total_records: 
          parseInt(users.rows[0].count) +
          parseInt(events.rows[0].count) +
          parseInt(publicApts.rows[0].count) +
          parseInt(history.rows[0].count) +
          parseInt(settings.rows[0].count)
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Błąd pobierania info o backupie:', error);
    res.status(500).json({ error: 'Błąd pobierania informacji' });
  }
});

export default router;

