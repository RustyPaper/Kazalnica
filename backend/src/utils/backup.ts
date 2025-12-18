import pool from '../config/database';
import fs from 'fs';
import path from 'path';

interface BackupData {
  timestamp: string;
  version: string;
  tables: {
    users: any[];
    events: any[];
    public_apartments: any[];
    public_apartments_edit_history: any[];
    settings: any[];
  };
}

// Generuj backup w formacie JSON
export const generateJsonBackup = async (): Promise<BackupData> => {
  const client = await pool.connect();
  
  try {
    console.log('📦 Tworzenie backupu JSON...');

    // Pobierz wszystkie dane z tabel
    const users = await client.query('SELECT * FROM users ORDER BY created_at');
    const events = await client.query('SELECT * FROM events ORDER BY created_at');
    const publicApartments = await client.query('SELECT * FROM public_apartments ORDER BY created_at');
    const editHistory = await client.query('SELECT * FROM public_apartments_edit_history ORDER BY edited_at');
    const settings = await client.query('SELECT * FROM settings');

    const backup: BackupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      tables: {
        users: users.rows,
        events: events.rows,
        public_apartments: publicApartments.rows,
        public_apartments_edit_history: editHistory.rows,
        settings: settings.rows
      }
    };

    console.log('✅ Backup JSON utworzony');
    return backup;

  } catch (error) {
    console.error('❌ Błąd tworzenia backupu JSON:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Generuj backup w formacie SQL (pełny dump bez TRUNCATE)
export const generateSqlBackup = async (): Promise<string> => {
  const client = await pool.connect();
  
  try {
    console.log('📦 Tworzenie pełnego dumpu SQL...');

    let sql = '';
    const timestamp = new Date().toISOString();

    // Nagłówek
    sql += `-- =============================================\n`;
    sql += `-- Calendar App - Full Database Dump\n`;
    sql += `-- Created: ${timestamp}\n`;
    sql += `-- PostgreSQL Export\n`;
    sql += `-- \n`;
    sql += `-- INSTRUKCJA UŻYCIA:\n`;
    sql += `-- 1. Utwórz nową bazę: createdb calendar_app_new\n`;
    sql += `-- 2. Uruchom aplikację raz, aby utworzyć tabele\n`;
    sql += `-- 3. Zaimportuj ten plik: psql -d calendar_app_new -f backup.sql\n`;
    sql += `-- \n`;
    sql += `-- UWAGA: Ten backup NIE modyfikuje istniejącej bazy!\n`;
    sql += `-- =============================================\n\n`;

    sql += `-- Start transaction\n`;
    sql += `BEGIN;\n\n`;

    // ===== USERS =====
    const users = await client.query('SELECT * FROM users ORDER BY created_at');
    
    if (users.rows.length > 0) {
      sql += `-- =============================================\n`;
      sql += `-- Data for table: users\n`;
      sql += `-- Records: ${users.rows.length}\n`;
      sql += `-- =============================================\n\n`;

      for (const user of users.rows) {
        const apartments = JSON.stringify(user.apartments).replace(/'/g, "''");
        const permissions = JSON.stringify(user.permissions).replace(/'/g, "''");
        
        sql += `INSERT INTO users (id, login, password, first_name, last_name, role, phone_number, email, apartments, permissions, created_at)\n`;
        sql += `VALUES (\n`;
        sql += `  '${user.id}',\n`;
        sql += `  '${user.login.replace(/'/g, "''")}',\n`;
        sql += `  '${user.password}',\n`;
        sql += `  '${user.first_name.replace(/'/g, "''")}',\n`;
        sql += `  ${user.last_name ? `'${user.last_name.replace(/'/g, "''")}'` : 'NULL'},\n`;
        sql += `  '${user.role}',\n`;
        sql += `  ${user.phone_number ? `'${user.phone_number}'` : 'NULL'},\n`;
        sql += `  ${user.email ? `'${user.email.replace(/'/g, "''")}'` : 'NULL'},\n`;
        sql += `  '${apartments}'::jsonb,\n`;
        sql += `  '${permissions}'::jsonb,\n`;
        sql += `  '${user.created_at.toISOString()}'\n`;
        sql += `)\n`;
        sql += `ON CONFLICT (id) DO UPDATE SET\n`;
        sql += `  login = EXCLUDED.login,\n`;
        sql += `  password = EXCLUDED.password,\n`;
        sql += `  first_name = EXCLUDED.first_name,\n`;
        sql += `  last_name = EXCLUDED.last_name,\n`;
        sql += `  role = EXCLUDED.role,\n`;
        sql += `  phone_number = EXCLUDED.phone_number,\n`;
        sql += `  email = EXCLUDED.email,\n`;
        sql += `  apartments = EXCLUDED.apartments,\n`;
        sql += `  permissions = EXCLUDED.permissions,\n`;
        sql += `  created_at = EXCLUDED.created_at;\n\n`;
      }
    }

    // ===== EVENTS =====
    const events = await client.query('SELECT * FROM events ORDER BY created_at');
    
    if (events.rows.length > 0) {
      sql += `-- =============================================\n`;
      sql += `-- Data for table: events\n`;
      sql += `-- Records: ${events.rows.length}\n`;
      sql += `-- =============================================\n\n`;

      for (const event of events.rows) {
        sql += `INSERT INTO events (id, date, apartment_number, description, created_by, created_at)\n`;
        sql += `VALUES (\n`;
        sql += `  '${event.id}',\n`;
        sql += `  '${event.date.toISOString().split('T')[0]}',\n`;
        sql += `  '${event.apartment_number.replace(/'/g, "''")}',\n`;
        sql += `  ${event.description ? `'${event.description.replace(/'/g, "''")}'` : 'NULL'},\n`;
        sql += `  '${event.created_by}',\n`;
        sql += `  '${event.created_at.toISOString()}'\n`;
        sql += `)\n`;
        sql += `ON CONFLICT (id) DO UPDATE SET\n`;
        sql += `  date = EXCLUDED.date,\n`;
        sql += `  apartment_number = EXCLUDED.apartment_number,\n`;
        sql += `  description = EXCLUDED.description,\n`;
        sql += `  created_by = EXCLUDED.created_by,\n`;
        sql += `  created_at = EXCLUDED.created_at;\n\n`;
      }
    }

    // ===== PUBLIC APARTMENTS =====
    const publicApartments = await client.query('SELECT * FROM public_apartments ORDER BY id');
    
    if (publicApartments.rows.length > 0) {
      sql += `-- =============================================\n`;
      sql += `-- Data for table: public_apartments\n`;
      sql += `-- Records: ${publicApartments.rows.length}\n`;
      sql += `-- =============================================\n\n`;

      for (const apt of publicApartments.rows) {
        sql += `INSERT INTO public_apartments (id, apartment_number, owner_first_name, owner_last_name, phone_number, email, share_amount, status, collection_date, additional_info, is_locked, created_at)\n`;
        sql += `VALUES (\n`;
        sql += `  ${apt.id},\n`;
        sql += `  '${apt.apartment_number.replace(/'/g, "''")}',\n`;
        sql += `  ${apt.owner_first_name ? `'${apt.owner_first_name.replace(/'/g, "''")}'` : 'NULL'},\n`;
        sql += `  ${apt.owner_last_name ? `'${apt.owner_last_name.replace(/'/g, "''")}'` : 'NULL'},\n`;
        sql += `  ${apt.phone_number ? `'${apt.phone_number}'` : 'NULL'},\n`;
        sql += `  ${apt.email ? `'${apt.email.replace(/'/g, "''")}'` : 'NULL'},\n`;
        sql += `  ${apt.share_amount ? `'${apt.share_amount}'` : 'NULL'},\n`;
        sql += `  ${apt.status ? `'${apt.status}'` : 'NULL'},\n`;
        sql += `  ${apt.collection_date ? `'${apt.collection_date}'` : 'NULL'},\n`;
        sql += `  ${apt.additional_info ? `'${apt.additional_info.replace(/'/g, "''")}'` : 'NULL'},\n`;
        sql += `  ${apt.is_locked || false},\n`;
        sql += `  '${apt.created_at.toISOString()}'\n`;
        sql += `)\n`;
        sql += `ON CONFLICT (id) DO UPDATE SET\n`;
        sql += `  apartment_number = EXCLUDED.apartment_number,\n`;
        sql += `  owner_first_name = EXCLUDED.owner_first_name,\n`;
        sql += `  owner_last_name = EXCLUDED.owner_last_name,\n`;
        sql += `  phone_number = EXCLUDED.phone_number,\n`;
        sql += `  email = EXCLUDED.email,\n`;
        sql += `  share_amount = EXCLUDED.share_amount,\n`;
        sql += `  status = EXCLUDED.status,\n`;
        sql += `  collection_date = EXCLUDED.collection_date,\n`;
        sql += `  additional_info = EXCLUDED.additional_info,\n`;
        sql += `  is_locked = EXCLUDED.is_locked,\n`;
        sql += `  created_at = EXCLUDED.created_at;\n\n`;
      }

      // Aktualizuj sequence
      const maxId = publicApartments.rows[publicApartments.rows.length - 1].id;
      sql += `-- Update sequence for public_apartments\n`;
      sql += `SELECT setval('public_apartments_id_seq', ${maxId}, true);\n\n`;
    }

    // ===== EDIT HISTORY =====
    const editHistory = await client.query('SELECT * FROM public_apartments_edit_history ORDER BY id');
    
    if (editHistory.rows.length > 0) {
      sql += `-- =============================================\n`;
      sql += `-- Data for table: public_apartments_edit_history\n`;
      sql += `-- Records: ${editHistory.rows.length}\n`;
      sql += `-- =============================================\n\n`;

      for (const entry of editHistory.rows) {
        const changes = JSON.stringify(entry.changes).replace(/'/g, "''");
        const oldValues = entry.old_values ? JSON.stringify(entry.old_values).replace(/'/g, "''") : null;
        
        sql += `INSERT INTO public_apartments_edit_history (id, apartment_id, changes, old_values, edited_by, ip_address, user_agent, edited_at)\n`;
        sql += `VALUES (\n`;
        sql += `  ${entry.id},\n`;
        sql += `  ${entry.apartment_id},\n`;
        sql += `  '${changes}'::jsonb,\n`;
        sql += `  ${oldValues ? `'${oldValues}'::jsonb` : 'NULL'},\n`;
        sql += `  ${entry.edited_by ? `'${entry.edited_by.replace(/'/g, "''")}'` : 'NULL'},\n`;
        sql += `  ${entry.ip_address ? `'${entry.ip_address}'` : 'NULL'},\n`;
        sql += `  ${entry.user_agent ? `'${entry.user_agent.replace(/'/g, "''")}'` : 'NULL'},\n`;
        sql += `  '${entry.edited_at.toISOString()}'\n`;
        sql += `)\n`;
        sql += `ON CONFLICT (id) DO UPDATE SET\n`;
        sql += `  apartment_id = EXCLUDED.apartment_id,\n`;
        sql += `  changes = EXCLUDED.changes,\n`;
        sql += `  old_values = EXCLUDED.old_values,\n`;
        sql += `  edited_by = EXCLUDED.edited_by,\n`;
        sql += `  ip_address = EXCLUDED.ip_address,\n`;
        sql += `  user_agent = EXCLUDED.user_agent,\n`;
        sql += `  edited_at = EXCLUDED.edited_at;\n\n`;
      }

      const maxHistoryId = editHistory.rows[editHistory.rows.length - 1].id;
      sql += `-- Update sequence for public_apartments_edit_history\n`;
      sql += `SELECT setval('public_apartments_edit_history_id_seq', ${maxHistoryId}, true);\n\n`;
    }

    // ===== SETTINGS =====
    const settings = await client.query('SELECT * FROM settings');
    
    if (settings.rows.length > 0) {
      sql += `-- =============================================\n`;
      sql += `-- Data for table: settings\n`;
      sql += `-- Records: ${settings.rows.length}\n`;
      sql += `-- =============================================\n\n`;

      for (const setting of settings.rows) {
        const value = JSON.stringify(setting.value).replace(/'/g, "''");
        
        sql += `INSERT INTO settings (key, value, updated_at)\n`;
        sql += `VALUES (\n`;
        sql += `  '${setting.key}',\n`;
        sql += `  '${value}'::jsonb,\n`;
        sql += `  '${setting.updated_at.toISOString()}'\n`;
        sql += `)\n`;
        sql += `ON CONFLICT (key) DO UPDATE SET\n`;
        sql += `  value = EXCLUDED.value,\n`;
        sql += `  updated_at = EXCLUDED.updated_at;\n\n`;
      }
    }

    // Zamknij transakcję
    sql += `-- Commit transaction\n`;
    sql += `COMMIT;\n\n`;

    sql += `-- =============================================\n`;
    sql += `-- Dump completed successfully\n`;
    sql += `-- Total records exported: ${
      users.rows.length + 
      events.rows.length + 
      publicApartments.rows.length + 
      editHistory.rows.length + 
      settings.rows.length
    }\n`;
    sql += `-- =============================================\n`;

    console.log('✅ Pełny dump SQL utworzony');
    return sql;

  } catch (error) {
    console.error('❌ Błąd tworzenia dumpu SQL:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Zapisz backup do pliku (opcjonalnie)
export const saveBackupToFile = async (format: 'json' | 'sql'): Promise<string> => {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupDir = path.join(__dirname, '../../backups');
  
  // Utwórz folder jeśli nie istnieje
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  let filename: string;
  let content: string;

  if (format === 'json') {
    const backup = await generateJsonBackup();
    filename = `backup_${timestamp}.json`;
    content = JSON.stringify(backup, null, 2);
  } else {
    const backup = await generateSqlBackup();
    filename = `backup_${timestamp}.sql`;
    content = backup;
  }

  const filepath = path.join(backupDir, filename);
  fs.writeFileSync(filepath, content, 'utf-8');

  console.log(`✅ Backup zapisany: ${filepath}`);
  return filepath;
};
