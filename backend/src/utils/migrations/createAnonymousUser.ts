import pool from '../../config/database';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';

export const createAnonymousUser = async () => {
  const client = await pool.connect();
  
  try {
    console.log('👤 Sprawdzam użytkownika Anonymous...');
    
    // Sprawdź czy użytkownik Anonymous już istnieje
    const checkUser = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [ANONYMOUS_USER_ID]
    );

    if (checkUser.rows.length === 0) {
      console.log('➕ Tworzę użytkownika Anonymous...');
      
      // Utwórz hasło (nigdy nie będzie używane)
      const hashedPassword = await bcrypt.hash('anonymous-no-login-' + uuidv4(), 10);
      
      await client.query(
        `INSERT INTO users 
          (id, login, password, first_name, last_name, role, apartments, permissions, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
        [
          ANONYMOUS_USER_ID,
          'anonymous',
          hashedPassword,
          'Anonim',
          'Systemowy',
          'user',
          JSON.stringify([]),
          JSON.stringify({
            viewCalendar: true,
            addEvent: false,
            deleteEvent: false
          })
        ]
      );
      
      console.log('✅ Użytkownik Anonymous utworzony');
    } else {
      console.log('✅ Użytkownik Anonymous już istnieje');
    }

  } catch (error) {
    console.error('❌ Błąd tworzenia użytkownika Anonymous:', error);
    throw error;
  } finally {
    client.release();
  }
};
