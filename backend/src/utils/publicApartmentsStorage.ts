import pool from '../config/database';
import { PublicApartment } from '../types';

// Pobierz wszystkie publiczne lokale
export const getAllPublicApartments = async (): Promise<PublicApartment[]> => {
  const result = await pool.query(`
    SELECT 
      id, apartment_number as "apartmentNumber",
      owner_first_name as "ownerFirstName",
      owner_last_name as "ownerLastName",
      phone_number as "phoneNumber",
      email,
      share_amount as "shareAmount",
      status,
      collection_date as "collectionDate",
      additional_info as "additionalInfo",
      created_at as "createdAt"
    FROM public_apartments
    ORDER BY created_at ASC
  `);
  return result.rows;
};

// Dodaj lokal publiczny
export const createPublicApartment = async (apt: Omit<PublicApartment, 'id' | 'createdAt'>): Promise<PublicApartment> => {
  const result = await pool.query(
    `INSERT INTO public_apartments 
      (apartment_number, owner_first_name, owner_last_name, phone_number, email, share_amount, status, collection_date, additional_info)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING id, apartment_number as "apartmentNumber",
      owner_first_name as "ownerFirstName",
      owner_last_name as "ownerLastName",
      phone_number as "phoneNumber",
      email,
      share_amount as "shareAmount",
      status,
      collection_date as "collectionDate",
      additional_info as "additionalInfo",
      created_at as "createdAt"
    `,
    [
      apt.apartmentNumber,
      apt.ownerFirstName ?? null,
      apt.ownerLastName ?? null,
      apt.phoneNumber ?? null,
      apt.email ?? null,
      apt.shareAmount ?? null,
      apt.status ?? null,
      apt.collectionDate ?? null,
      apt.additionalInfo ?? null
    ]
  );
  return result.rows[0];
};

// Edytuj lokal publiczny
export const updatePublicApartment = async (id: number, updates: Partial<Omit<PublicApartment, 'id' | 'createdAt'>>): Promise<PublicApartment | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.apartmentNumber !== undefined) {
    fields.push(`apartment_number = $${paramCount++}`);
    values.push(updates.apartmentNumber);
  }
  if (updates.ownerFirstName !== undefined) {
    fields.push(`owner_first_name = $${paramCount++}`);
    values.push(updates.ownerFirstName);
  }
  if (updates.ownerLastName !== undefined) {
    fields.push(`owner_last_name = $${paramCount++}`);
    values.push(updates.ownerLastName);
  }
  if (updates.phoneNumber !== undefined) {
    fields.push(`phone_number = $${paramCount++}`);
    values.push(updates.phoneNumber);
  }
  if (updates.email !== undefined) {
    fields.push(`email = $${paramCount++}`);
    values.push(updates.email);
  }
  if (updates.shareAmount !== undefined) {
    fields.push(`share_amount = $${paramCount++}`);
    values.push(updates.shareAmount);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramCount++}`);
    values.push(updates.status);
  }
  if (updates.collectionDate !== undefined) {
    fields.push(`collection_date = $${paramCount++}`);
    values.push(updates.collectionDate);
  }
  if (updates.additionalInfo !== undefined) {
    fields.push(`additional_info = $${paramCount++}`);
    values.push(updates.additionalInfo);
  }

  if (fields.length === 0) return getPublicApartmentById(id);

  values.push(id);

  const result = await pool.query(
    `UPDATE public_apartments SET ${fields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING id, apartment_number as "apartmentNumber",
        owner_first_name as "ownerFirstName",
        owner_last_name as "ownerLastName",
        phone_number as "phoneNumber",
        email,
        share_amount as "shareAmount",
        status,
        collection_date as "collectionDate",
        additional_info as "additionalInfo",
        created_at as "createdAt"
    `,
    values
  );
  return result.rows[0] || null;
};

export const getPublicApartmentById = async (id: number): Promise<PublicApartment | null> => {
  const result = await pool.query(
    `SELECT id, apartment_number as "apartmentNumber",
      owner_first_name as "ownerFirstName",
      owner_last_name as "ownerLastName",
      phone_number as "phoneNumber",
      email,
      share_amount as "shareAmount",
      status,
      collection_date as "collectionDate",
      additional_info as "additionalInfo",
      created_at as "createdAt"
     FROM public_apartments WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};
