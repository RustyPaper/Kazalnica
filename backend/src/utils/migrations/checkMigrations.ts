import pool from '../../config/database';

export const checkMigrations = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Sprawdzanie statusu migracji...\n');

    // Sprawdź kolumnę is_locked
    const lockColumn = await client.query(`
      SELECT 
        column_name,
        data_type,
        column_default,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'public_apartments' 
      AND column_name = 'is_locked'
    `);

    if (lockColumn.rows.length > 0) {
      console.log('✅ Kolumna is_locked istnieje:');
      console.log(lockColumn.rows[0]);
    } else {
      console.log('❌ Kolumna is_locked NIE istnieje');
    }

    // Sprawdź indeks
    const lockIndex = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'public_apartments'
      AND indexname = 'idx_public_apartments_locked'
    `);

    if (lockIndex.rows.length > 0) {
      console.log('\n✅ Indeks idx_public_apartments_locked istnieje');
    } else {
      console.log('\n❌ Indeks idx_public_apartments_locked NIE istnieje');
    }

    // Pokaż przykładowe dane
    const sample = await client.query(`
      SELECT id, apartment_number, is_locked
      FROM public_apartments
      LIMIT 5
    `);

    if (sample.rows.length > 0) {
      console.log('\n📊 Przykładowe dane:');
      console.table(sample.rows);
    }

  } catch (error) {
    console.error('❌ Błąd sprawdzania migracji:', error);
    throw error;
  } finally {
    client.release();
  }
};
