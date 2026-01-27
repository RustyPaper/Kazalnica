import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Wykryj czy używasz poolingu
const isPooling = process.env.DATABASE_URL?.includes('pooler.supabase.com');
const connectionType = isPooling ? 'Pooling (Session)' : 'Direct';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  
  ssl: { 
    rejectUnauthorized: false 
  },
  
  // Optymalne ustawienia dla session pooling
  max: 20,                    // Maksymalna liczba połączeń w pool
  min: 2,                     // Minimalna liczba aktywnych połączeń
  idleTimeoutMillis: 30000,   // Zamknij bezczynne połączenia po 30s
  connectionTimeoutMillis: 10000,  // Timeout próby połączenia
});

// Event listeners
pool.on('connect', (client) => {
  console.log(`✅ Połączono z bazą danych PostgreSQL (${connectionType})`);
});

pool.on('error', (err, client) => {
  console.error('❌ Nieoczekiwany błąd na bezczynnym kliencie:', err.message);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Otrzymano sygnał ${signal}, zamykanie połączeń...`);
  try {
    await pool.end();
    console.log('👋 Pool bazy danych zamknięty');
    process.exit(0);
  } catch (err) {
    console.error('❌ Błąd zamykania pool:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default pool;
