import pool from '../config/database';
import { User, Event } from '../types';

// ============= USERS =============

export const getAllUsers = async (): Promise<User[]> => {
  const result = await pool.query(`
    SELECT 
      id, login, password, first_name as "firstName", 
      last_name as "lastName", role, phone_number as "phoneNumber", 
      email, apartments, permissions, created_at as "createdAt"
    FROM users
    ORDER BY created_at DESC
  `);
  return result.rows;
};

export const getUserById = async (id: string): Promise<User | null> => {
  const result = await pool.query(
    `SELECT 
      id, login, password, first_name as "firstName", 
      last_name as "lastName", role, phone_number as "phoneNumber", 
      email, apartments, permissions, created_at as "createdAt"
    FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const getUserByLogin = async (login: string): Promise<User | null> => {
  const result = await pool.query(
    `SELECT 
      id, login, password, first_name as "firstName", 
      last_name as "lastName", role, phone_number as "phoneNumber", 
      email, apartments, permissions, created_at as "createdAt"
    FROM users WHERE login = $1`,
    [login]
  );
  return result.rows[0] || null;
};

export const createUser = async (user: User): Promise<User> => {
  const result = await pool.query(
    `INSERT INTO users 
      (id, login, password, first_name, last_name, role, phone_number, email, apartments, permissions)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING 
      id, login, password, first_name as "firstName", 
      last_name as "lastName", role, phone_number as "phoneNumber", 
      email, apartments, permissions, created_at as "createdAt"`,
    [
      user.id,
      user.login,
      user.password,
      user.firstName,
      user.lastName,
      user.role,
      user.phoneNumber || null,
      user.email || null,
      JSON.stringify(user.apartments || []),
      JSON.stringify(user.permissions)
    ]
  );
  return result.rows[0];
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.firstName !== undefined) {
    fields.push(`first_name = $${paramCount++}`);
    values.push(updates.firstName);
  }
  if (updates.lastName !== undefined) {
    fields.push(`last_name = $${paramCount++}`);
    values.push(updates.lastName);
  }
  if (updates.password !== undefined) {
    fields.push(`password = $${paramCount++}`);
    values.push(updates.password);
  }
  if (updates.phoneNumber !== undefined) {
    fields.push(`phone_number = $${paramCount++}`);
    values.push(updates.phoneNumber);
  }
  if (updates.email !== undefined) {
    fields.push(`email = $${paramCount++}`);
    values.push(updates.email);
  }
  if (updates.apartments !== undefined) {
    fields.push(`apartments = $${paramCount++}`);
    values.push(JSON.stringify(updates.apartments));
  }
  if (updates.permissions !== undefined) {
    fields.push(`permissions = $${paramCount++}`);
    values.push(JSON.stringify(updates.permissions));
  }

  if (fields.length === 0) return getUserById(id);

  values.push(id);
  
  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} 
     WHERE id = $${paramCount}
     RETURNING 
       id, login, password, first_name as "firstName", 
       last_name as "lastName", role, phone_number as "phoneNumber", 
       email, apartments, permissions, created_at as "createdAt"`,
    values
  );

  return result.rows[0] || null;
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
};

// ============= EVENTS =============

export const getAllEvents = async (): Promise<Event[]> => {
  const result = await pool.query(`
    SELECT 
      id, date::text, apartment_number as "apartmentNumber", 
      description, created_by as "createdBy", created_at as "createdAt"
    FROM events
    ORDER BY date DESC
  `);
  return result.rows;
};

export const getEventById = async (id: string): Promise<Event | null> => {
  const result = await pool.query(
    `SELECT 
      id, date::text, apartment_number as "apartmentNumber", 
      description, created_by as "createdBy", created_at as "createdAt"
    FROM events WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const createEvent = async (event: Event): Promise<Event> => {
  const result = await pool.query(
    `INSERT INTO events (id, date, apartment_number, description, created_by, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING 
       id, date::text, apartment_number as "apartmentNumber", 
       description, created_by as "createdBy", created_at as "createdAt"`,
    [
      event.id,
      event.date,
      event.apartmentNumber,
      event.description || null,
      event.createdBy,
      event.createdAt
    ]
  );
  return result.rows[0];
};

export const updateEvent = async (id: string, updates: Partial<Event>): Promise<Event | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.date !== undefined) {
    fields.push(`date = $${paramCount++}`);
    values.push(updates.date);
  }
  if (updates.apartmentNumber !== undefined) {
    fields.push(`apartment_number = $${paramCount++}`);
    values.push(updates.apartmentNumber);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(updates.description);
  }

  if (fields.length === 0) return getEventById(id);

  values.push(id);

  const result = await pool.query(
    `UPDATE events SET ${fields.join(', ')} 
     WHERE id = $${paramCount}
     RETURNING 
       id, date::text, apartment_number as "apartmentNumber", 
       description, created_by as "createdBy", created_at as "createdAt"`,
    values
  );

  return result.rows[0] || null;
};

export const deleteEvent = async (id: string): Promise<boolean> => {
  const result = await pool.query('DELETE FROM events WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
};

// ============= SETTINGS =============

export const getSetting = async (key: string): Promise<any | null> => {
  const result = await pool.query(
    'SELECT value FROM settings WHERE key = $1',
    [key]
  );
  return result.rows[0]?.value || null;
};

export const setSetting = async (key: string, value: any): Promise<void> => {
  await pool.query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (key) 
     DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
    [key, JSON.stringify(value)]
  );
};
