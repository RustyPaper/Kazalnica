import express, { Response, Request } from 'express';
import { AuthRequest, Poll, PollOption, PollVote } from '../types';
import { authenticateToken } from '../middleware/auth';
import pool from '../config/database';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter dla głosowania
const voteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 10, // max 10 głosów na IP
  message: { error: 'Zbyt wiele głosów. Spróbuj ponownie za 15 minut.' }
});

// ============================================
// GET - Lista wszystkich ankiet (publiczne)
// ============================================
router.get('/', async (req: Request, res: Response) => {
  try {
    // Automatycznie zamknij wygasłe ankiety
    await pool.query('SELECT close_expired_polls()');
    
    const result = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.description,
        p.created_by as "createdBy",
        p.created_at as "createdAt",
        p.closes_at as "closesAt",
        p.is_closed as "isClosed",
        p.allow_multiple_votes as "allowMultipleVotes",
        u.first_name || ' ' || COALESCE(u.last_name, '') as "createdByName"
      FROM polls p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching polls:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============================================
// GET - Szczegóły ankiety z opcjami (publiczne)
// ============================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Pobierz ankietę
    const pollResult = await pool.query(`
      SELECT 
        id,
        title,
        description,
        created_by as "createdBy",
        created_at as "createdAt",
        closes_at as "closesAt",
        is_closed as "isClosed",
        allow_multiple_votes as "allowMultipleVotes"
      FROM polls
      WHERE id = $1
    `, [id]);
    
    if (pollResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ankieta nie znaleziona' });
    }
    
    // Pobierz opcje
    const optionsResult = await pool.query(`
      SELECT 
        id,
        poll_id as "pollId",
        option_text as "optionText",
        option_order as "optionOrder",
        created_at as "createdAt"
      FROM poll_options
      WHERE poll_id = $1
      ORDER BY option_order ASC
    `, [id]);
    
    const poll = {
      ...pollResult.rows[0],
      options: optionsResult.rows
    };
    
    res.json(poll);
  } catch (error) {
    console.error('❌ Error fetching poll:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============================================
// GET - Wyniki ankiety (publiczne)
// ============================================
router.get('/:id/results', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Pobierz ankietę
    const pollResult = await pool.query(`
      SELECT * FROM polls WHERE id = $1
    `, [id]);
    
    if (pollResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ankieta nie znaleziona' });
    }
    
    // Pobierz opcje
    const optionsResult = await pool.query(`
      SELECT 
        id,
        option_text as "optionText",
        option_order as "optionOrder"
      FROM poll_options
      WHERE poll_id = $1
      ORDER BY option_order ASC
    `, [id]);
    
    // Pobierz wyniki głosowania
    const votesResult = await pool.query(`
      SELECT 
        option_id as "optionId",
        COUNT(*) as "voteCount",
        SUM(total_shares) as "shareCount"
      FROM poll_votes
      WHERE poll_id = $1
      GROUP BY option_id
    `, [id]);
    
    const votesMap = new Map(
      votesResult.rows.map(v => [v.optionId, v])
    );
    
    const totalVotes = votesResult.rows.reduce((sum, v) => sum + parseInt(v.voteCount), 0);
    const totalShares = votesResult.rows.reduce((sum, v) => sum + parseFloat(v.shareCount || 0), 0);
    
    const results = optionsResult.rows.map(option => {
      const votes = votesMap.get(option.id);
      const voteCount = votes ? parseInt(votes.voteCount) : 0;
      const shareCount = votes ? parseFloat(votes.shareCount) : 0;
      
      return {
        optionId: option.id,
        optionText: option.optionText,
        voteCount,
        shareCount,
        percentage: totalShares > 0 ? (shareCount / totalShares) * 100 : 0
      };
    });
    
    res.json({
      ...pollResult.rows[0],
      options: optionsResult.rows,
      results,
      totalVotes,
      totalShares
    });
  } catch (error) {
    console.error('❌ Error fetching poll results:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============================================
// POST - Utwórz ankietę (tylko admin)
// ============================================
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Sprawdź czy admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Tylko admin może tworzyć ankiety' });
    }
    
    const { title, description, options, closesAt, allowMultipleVotes } = req.body;
    
    if (!title || !options || options.length < 2) {
      return res.status(400).json({ 
        error: 'Tytuł i minimum 2 opcje są wymagane' 
      });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Utwórz ankietę
      const pollResult = await client.query(`
        INSERT INTO polls (title, description, created_by, closes_at, allow_multiple_votes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [title, description || null, req.user.id, closesAt || null, allowMultipleVotes || false]);
      
      const pollId = pollResult.rows[0].id;
      
      // Dodaj opcje
      for (let i = 0; i < options.length; i++) {
        await client.query(`
          INSERT INTO poll_options (poll_id, option_text, option_order)
          VALUES ($1, $2, $3)
        `, [pollId, options[i], i + 1]);
      }
      
      await client.query('COMMIT');
      
      console.log(`✅ Poll created: ${pollId} by ${req.user.login}`);
      
      res.status(201).json({ 
        message: 'Ankieta utworzona',
        pollId 
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error creating poll:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============================================
// POST - Oddaj głos (publiczne z rate limiting)
// ============================================
router.post('/:id/vote', voteLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { optionId, apartments, voterName, voterPhone } = req.body;
    
    if (!optionId || !apartments || apartments.length === 0) {
      return res.status(400).json({ 
        error: 'Opcja i minimum 1 lokal są wymagane' 
      });
    }
    
    // Sprawdź czy ankieta istnieje i jest otwarta
    const pollResult = await pool.query(`
      SELECT is_closed, closes_at 
      FROM polls 
      WHERE id = $1
    `, [id]);
    
    if (pollResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ankieta nie znaleziona' });
    }
    
    const poll = pollResult.rows[0];
    
    if (poll.is_closed) {
      return res.status(400).json({ error: 'Ankieta jest zamknięta' });
    }
    
    if (poll.closes_at && new Date(poll.closes_at) < new Date()) {
      return res.status(400).json({ error: 'Ankieta wygasła' });
    }
    
    // Oblicz sumę udziałów
    const totalShares = apartments.reduce((sum: number, apt: any) => {
      const shares = parseFloat(apt.shareAmount || 0);
      return sum + (isNaN(shares) ? 0 : shares);
    }, 0);
    
    // Metadata
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Zapisz głos
    await pool.query(`      INSERT INTO poll_votes (
        poll_id, 
        option_id, 
        voter_name, 
        voter_phone, 
        apartments, 
        total_shares,
        ip_address,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      id,
      optionId,
      voterName || null,
      voterPhone || null,
      JSON.stringify(apartments),
      totalShares,
      ipAddress,
      userAgent
    ]);
    
    console.log(`✅ Vote cast in poll ${id}: ${apartments.length} apartments, ${totalShares} shares`);
    
    res.json({ 
      message: 'Głos oddany pomyślnie',
      totalShares 
    });
    
  } catch (error: any) {
    console.error('❌ Error voting:', error);
    
    // Sprawdź czy to błąd unikalności (już głosował)
    if (error.code === '23505') {
      return res.status(400).json({ 
        error: 'Już oddałeś głos w tej ankiecie z tym lokalem' 
      });
    }
    
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============================================
// PUT - Zamknij ankietę (tylko admin)
// ============================================
router.put('/:id/close', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Tylko admin może zamykać ankiety' });
    }
    
    const { id } = req.params;
    
    await pool.query(`
      UPDATE polls 
      SET is_closed = TRUE 
      WHERE id = $1
    `, [id]);
    
    console.log(`🔒 Poll closed: ${id} by ${req.user.login}`);
    
    res.json({ message: 'Ankieta zamknięta' });
    
  } catch (error) {
    console.error('❌ Error closing poll:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============================================
// PUT - Otwórz ponownie ankietę (tylko admin)
// ============================================
router.put('/:id/reopen', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Tylko admin może otwierać ankiety' });
    }
    
    const { id } = req.params;
    
    await pool.query(`
      UPDATE polls 
      SET is_closed = FALSE 
      WHERE id = $1
    `, [id]);
    
    console.log(`🔓 Poll reopened: ${id} by ${req.user.login}`);
    
    res.json({ message: 'Ankieta otwarta ponownie' });
    
  } catch (error) {
    console.error('❌ Error reopening poll:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ============================================
// DELETE - Usuń ankietę (tylko admin)
// ============================================
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Tylko admin może usuwać ankiety' });
    }
    
    const { id } = req.params;
    
    await pool.query('DELETE FROM polls WHERE id = $1', [id]);
    
    console.log(`🗑️ Poll deleted: ${id} by ${req.user.login}`);
    
    res.json({ message: 'Ankieta usunięta' });
    
  } catch (error) {
    console.error('❌ Error deleting poll:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;

// ============================================
// GET - Sprawdź czy już głosowałeś
// ============================================
router.get('/:id/check-vote', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { apartmentNumbers } = req.query;
    
    if (!apartmentNumbers) {
      return res.json({ hasVoted: false });
    }
    
    const numbers = (apartmentNumbers as string).split(',');
    
    // Sprawdź czy któryś z lokali już głosował
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM poll_votes
      WHERE poll_id = $1
      AND apartments::jsonb @> ANY(
        ARRAY[${numbers.map((_, i) => `$${i + 2}`).join(',')}]::jsonb[]
      )
    `, [id, ...numbers.map(n => JSON.stringify([{number: n}]))]);
    
    const hasVoted = parseInt(result.rows[0].count) > 0;
    
    res.json({ hasVoted });
    
  } catch (error) {
    console.error('Error checking vote:', error);
    res.json({ hasVoted: false });
  }
});

// ============================================
// GET - Eksport wyników do CSV (admin)
// ============================================
router.get('/:id/export', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Tylko admin może eksportować' });
    }
    
    const { id } = req.params;
    
    // Pobierz szczegóły głosów
    const result = await pool.query(`
      SELECT 
        pv.voted_at,
        po.option_text,
        pv.voter_name,
        pv.voter_phone,
        pv.apartments,
        pv.total_shares
      FROM poll_votes pv
      JOIN poll_options po ON pv.option_id = po.id
      WHERE pv.poll_id = $1
      ORDER BY pv.voted_at DESC
    `, [id]);
    
    // Generuj CSV
    let csv = 'Data,Opcja,Imię,Telefon,Lokale,Suma udziałów\n';
    
    result.rows.forEach(row => {
      const date = new Date(row.voted_at).toLocaleString('pl-PL');
      const apartments = JSON.parse(row.apartments)
        .map((a: any) => `${a.number} (${a.shareAmount || 0})`)
        .join('; ');
      
      csv += `"${date}","${row.option_text}","${row.voter_name || ''}","${row.voter_phone || ''}","${apartments}","${row.total_shares}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=poll-${id}-results.csv`);
    res.send('\uFEFF' + csv); // BOM dla UTF-8
    
  } catch (error) {
    console.error('Error exporting results:', error);
    res.status(500).json({ error: 'Błąd eksportu' });
  }
});

