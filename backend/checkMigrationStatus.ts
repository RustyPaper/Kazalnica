// W backend/checkMigrationStatus.ts
import { checkMigrations } from './src/utils/migrations/checkMigrations';
import pool from './src/config/database';

(async () => {
  try {
    await checkMigrations();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error(error);
    await pool.end();
    process.exit(1);
  }
})();

//npx ts-node backend/checkMigrationStatus.ts
