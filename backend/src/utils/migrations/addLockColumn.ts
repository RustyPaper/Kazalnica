import pool from '../../config/database';

export const addLockColumn = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔒 Dodawanie kolumny is_locked...');

    // Sprawdź czy kolumna już istnieje
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'public_apartments' 
      AND column_name = 'is_locked'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('ℹ️  Kolumna is_locked już istnieje');
      return;
    }

    // Dodaj kolumnę is_locked do public_apartments
    await client.query(`
      ALTER TABLE public_apartments 
      ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;
    `);

    console.log('✅ Kolumna is_locked dodana do public_apartments');

    // Dodaj indeks dla lepszej wydajności
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_public_apartments_locked 
      ON public_apartments(is_locked);
    `);

    console.log('✅ Indeks idx_public_apartments_locked utworzony');
    console.log('✅ Migracja lockowania zakończona pomyślnie');

  } catch (error: any) {
    // Jeśli kolumna już istnieje (błąd 42701)
    if (error.code === '42701') {
      console.log('ℹ️  Kolumna is_locked już istnieje (kod błędu 42701)');
      return;
    }
    
    console.error('❌ Błąd migracji lockowania:', error);
    throw error;
  } finally {
    client.release();
  }
};
