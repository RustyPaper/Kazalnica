import pool from '../config/database';
import { PublicApartment } from '../types';

// ⭐ HELPER: Formatowanie daty do YYYY-MM-DD
const formatDate = (date: any): string | null => {
  if (!date) return null;
  
  try {
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('❌ Error formatting date:', error);
    return null;
  }
};

// ⭐ HELPER: Formatowanie row z bazy
const formatApartmentRow = (row: any): PublicApartment => {
  return {
    id: row.id,
    apartmentNumber: row.apartmentNumber,
    ownerFirstName: row.ownerFirstName,
    ownerLastName: row.ownerLastName,
    phoneNumber: row.phoneNumber,
    email: row.email,
    shareAmount: row.shareAmount,
    status: row.status,
    collectionDate: formatDate(row.collectionDate),  // ✅ string | null
    additionalInfo: row.additionalInfo,
    isLocked: row.isLocked ?? false,
    createdAt: row.createdAt
  };
};

// ============================================
// GET ALL
// ============================================
export const getAllPublicApartments = async (): Promise<PublicApartment[]> => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        id, 
        apartment_number as "apartmentNumber",
        owner_first_name as "ownerFirstName",
        owner_last_name as "ownerLastName",
        phone_number as "phoneNumber",
        email,
        share_amount as "shareAmount",
        status,
        collection_date::DATE as "collectionDate",
        additional_info as "additionalInfo",
        is_locked as "isLocked",
        created_at as "createdAt"
      FROM public_apartments
      ORDER BY created_at DESC`
    );

    return result.rows.map(formatApartmentRow);
  } finally {
    client.release();
  }
};

// ============================================
// GET BY ID
// ============================================
export const getPublicApartmentById = async (id: number): Promise<PublicApartment | null> => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        id, 
        apartment_number as "apartmentNumber",
        owner_first_name as "ownerFirstName",
        owner_last_name as "ownerLastName",
        phone_number as "phoneNumber",
        email,
        share_amount as "shareAmount",
        status,
        collection_date::DATE as "collectionDate",
        additional_info as "additionalInfo",
        is_locked as "isLocked",
        created_at as "createdAt"
      FROM public_apartments
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;
    
    return formatApartmentRow(result.rows[0]);
  } finally {
    client.release();
  }
};

// ============================================
// CREATE
// ============================================
export const createPublicApartment = async (
  apt: Omit<PublicApartment, 'id' | 'createdAt'>
): Promise<PublicApartment> => {
  const formattedDate = apt.collectionDate ? formatDate(apt.collectionDate) : null;
  
  const result = await pool.query(
    `INSERT INTO public_apartments 
      (apartment_number, owner_first_name, owner_last_name, phone_number, 
       email, share_amount, status, collection_date, additional_info, is_locked)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING 
      id, 
      apartment_number as "apartmentNumber",
      owner_first_name as "ownerFirstName",
      owner_last_name as "ownerLastName",
      phone_number as "phoneNumber",
      email,
      share_amount as "shareAmount",
      status,
      collection_date::DATE as "collectionDate",
      additional_info as "additionalInfo",
      is_locked as "isLocked",
      created_at as "createdAt"`,
    [
      apt.apartmentNumber,
      apt.ownerFirstName ?? null,
      apt.ownerLastName ?? null,
      apt.phoneNumber ?? null,
      apt.email ?? null,
      apt.shareAmount ?? null,
      apt.status ?? null,
      formattedDate,
      apt.additionalInfo ?? null,
      apt.isLocked ?? false
    ]
  );
  
  return formatApartmentRow(result.rows[0]);
};

// ============================================
// UPDATE
// ============================================
export const updatePublicApartment = async (
  id: number,
  updates: Partial<Omit<PublicApartment, 'id' | 'createdAt'>>
): Promise<PublicApartment | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.apartmentNumber !== undefined) {
    fields.push(`apartment_number = $${paramCount++}`);
    values.push(updates.apartmentNumber);
  }
  if (updates.ownerFirstName !== undefined) {
    fields.push(`owner_first_name = $${paramCount++}`);
    values.push(updates.ownerFirstName ?? null);
  }
  if (updates.ownerLastName !== undefined) {
    fields.push(`owner_last_name = $${paramCount++}`);
    values.push(updates.ownerLastName ?? null);
  }
  if (updates.phoneNumber !== undefined) {
    fields.push(`phone_number = $${paramCount++}`);
    values.push(updates.phoneNumber ?? null);
  }
  if (updates.email !== undefined) {
    fields.push(`email = $${paramCount++}`);
    values.push(updates.email ?? null);
  }
  if (updates.shareAmount !== undefined) {
    fields.push(`share_amount = $${paramCount++}`);
    values.push(updates.shareAmount ?? null);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramCount++}`);
    values.push(updates.status ?? null);
  }
  if (updates.collectionDate !== undefined) {
    fields.push(`collection_date = $${paramCount++}`);
    values.push(updates.collectionDate ? formatDate(updates.collectionDate) : null);
  }
  if (updates.additionalInfo !== undefined) {
    fields.push(`additional_info = $${paramCount++}`);
    values.push(updates.additionalInfo ?? null);
  }
  if (updates.isLocked !== undefined) {
    fields.push(`is_locked = $${paramCount++}`);
    values.push(updates.isLocked);
  }

  if (fields.length === 0) {
    return getPublicApartmentById(id);
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE public_apartments 
     SET ${fields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING 
       id, 
       apartment_number as "apartmentNumber",
       owner_first_name as "ownerFirstName",
       owner_last_name as "ownerLastName",
       phone_number as "phoneNumber",
       email,
       share_amount as "shareAmount",
       status,
       collection_date::DATE as "collectionDate",
       additional_info as "additionalInfo",
       is_locked as "isLocked",
       created_at as "createdAt"`,
    values
  );
  
  if (result.rows.length === 0) return null;
  
  return formatApartmentRow(result.rows[0]);
};

// ============================================
// TOGGLE LOCK
// ============================================
export const toggleLockPublicApartment = async (id: number): Promise<PublicApartment | null> => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE public_apartments 
       SET is_locked = NOT is_locked 
       WHERE id = $1 
       RETURNING 
         id, 
         apartment_number as "apartmentNumber",
         owner_first_name as "ownerFirstName",
         owner_last_name as "ownerLastName",
         phone_number as "phoneNumber",
         email,
         share_amount as "shareAmount",
         status,
         collection_date::DATE as "collectionDate",
         additional_info as "additionalInfo",
         is_locked as "isLocked",
         created_at as "createdAt"`,
      [id]
    );

    if (result.rows.length === 0) return null;

    return formatApartmentRow(result.rows[0]);
  } finally {
    client.release();
  }
};

// ============================================
// LOG EDIT
// ============================================
export const logApartmentEdit = async (
  apartmentId: number,
  changes: Record<string, any>,
  oldValues: Record<string, any>,
  editedBy: string,
  ipAddress: string,
  userAgent: string
): Promise<void> => {
  const formattedChanges = { ...changes };
  const formattedOldValues = { ...oldValues };
  
  if (formattedChanges.collectionDate !== undefined) {
    formattedChanges.collectionDate = formattedChanges.collectionDate 
      ? formatDate(formattedChanges.collectionDate) 
      : null;
  }
  if (formattedOldValues.collectionDate !== undefined) {
    formattedOldValues.collectionDate = formattedOldValues.collectionDate 
      ? formatDate(formattedOldValues.collectionDate) 
      : null;
  }
  
  await pool.query(
    `INSERT INTO public_apartments_edit_history 
      (apartment_id, changes, old_values, edited_by, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      apartmentId,
      JSON.stringify(formattedChanges),
      JSON.stringify(formattedOldValues),
      editedBy,
      ipAddress,
      userAgent
    ]
  );
};

// ============================================
// GET HISTORY
// ============================================
export const getApartmentEditHistory = async (apartmentId: number): Promise<any[]> => {
  const result = await pool.query(
    `SELECT 
      id,
      apartment_id as "apartmentId",
      changes,
      old_values as "oldValues",
      edited_by as "editedBy",
      ip_address as "ipAddress",
      user_agent as "userAgent",
      edited_at as "editedAt"
    FROM public_apartments_edit_history
    WHERE apartment_id = $1
    ORDER BY edited_at DESC
    LIMIT 50`,
    [apartmentId]
  );
  
  return result.rows.map(row => {
    const changes = typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes;
    const oldValues = typeof row.oldValues === 'string' ? JSON.parse(row.oldValues) : row.oldValues;
    
    if (changes.collectionDate) {
      changes.collectionDate = formatDate(changes.collectionDate);
    }
    if (oldValues.collectionDate) {
      oldValues.collectionDate = formatDate(oldValues.collectionDate);
    }
    
    return {
      ...row,
      changes,
      oldValues
    };
  });
};
