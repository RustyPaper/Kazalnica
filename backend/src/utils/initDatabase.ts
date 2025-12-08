import pool from '../config/database';
import { migrateInitialData } from './migrateData';

export const initDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Tworzenie tabel...');

    // Tabela użytkowników
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        login VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        phone_number VARCHAR(20),
        email VARCHAR(100),
        apartments JSONB DEFAULT '[]',
        permissions JSONB DEFAULT '{"viewCalendar": true, "addEvent": false, "deleteEvent": false}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela wydarzeń
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY,
        date DATE NOT NULL,
        apartment_number VARCHAR(50) NOT NULL,
        description TEXT,
        created_by UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela ustawień
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indeksy dla lepszej wydajności
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
      CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
      CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
    `);

    console.log('✅ Tabele utworzone pomyślnie');

    // Migracja początkowych danych
    await migrateInitialData();

  } catch (error) {
    console.error('❌ Błąd tworzenia tabel:', error);
    throw error;
  } finally {
    client.release();
  }
};
