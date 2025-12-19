import pool from '../config/database';
import { migrateInitialData } from './migrateData';
import { addLockColumn } from './migrations/addLockColumn';
import { createAnonymousUser } from './migrations/createAnonymousUser';

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

    // Tabela publicznych lokali (zgłoszenia anonimowe)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public_apartments (
        id SERIAL PRIMARY KEY,
        apartment_number VARCHAR(20) NOT NULL,
        owner_first_name VARCHAR(100),
        owner_last_name VARCHAR(100),
        phone_number VARCHAR(20),
        email VARCHAR(100),
        share_amount VARCHAR(20),
        status VARCHAR(20),
        collection_date VARCHAR(20),
        additional_info TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela historii edycji publicznych lokali
    await client.query(`
      CREATE TABLE IF NOT EXISTS public_apartments_edit_history (
        id SERIAL PRIMARY KEY,
        apartment_id INTEGER REFERENCES public_apartments(id) ON DELETE CASCADE,
        changes JSONB NOT NULL,
        old_values JSONB,
        edited_by VARCHAR(100),
        ip_address VARCHAR(45),
        user_agent TEXT,
        edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indeksy dla historii edycji
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_edit_history_apartment ON public_apartments_edit_history(apartment_id);
      CREATE INDEX IF NOT EXISTS idx_edit_history_date ON public_apartments_edit_history(edited_at);
    `);

    // Indeks dla numerów lokali
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_public_apartments_number ON public_apartments(apartment_number);
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

    // Migracja kolumny lockowania
    await addLockColumn();

    // Utwórz użytkownika Anonymous
    await createAnonymousUser();

  } catch (error) {
    console.error('❌ Błąd tworzenia tabel:', error);
    throw error;
  } finally {
    client.release();
  }
};
