import { Request } from 'express';

// ============================================
// APARTMENT TYPES
// ============================================

export interface Apartment {
  number: string;
  shareAmount: string | null;
  additionalInfo: string | null;
  status: 'lease_agreement' | 'notice_sent' | 'collection_date' | 'collected' | 'smr' | null;
  collectionDate: string | null;  // ⭐ Zmienione z | undefined na | null
}

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  login: string;
  password: string;
  firstName: string;
  lastName: string | null;  // ⭐ Zmienione z ? na | null
  apartments: Apartment[];
  phoneNumber: string | null;  // ⭐ Zmienione z ? na | null
  email: string | null;  // ⭐ Zmienione z ? na | null
  role: 'admin' | 'user';
  permissions: {
    viewCalendar: boolean;
    addEvent: boolean;
    deleteEvent: boolean;
    canEditPublicApartments?: boolean;
  };
  createdAt?: string;  // Opcjonalnie - dodaj jeśli używasz
}

// ============================================
// EVENT TYPES
// ============================================

export interface Event {
  id: string;
  date: string;
  apartmentNumber: string;
  description: string | null;  // ⭐ Zmienione z ? na | null
  createdBy: string;
  createdAt: string;
}

// ============================================
// AUTH TYPES
// ============================================

export interface AuthRequest extends Request {
  user?: User;
}

// ============================================
// SYSTEM SETTINGS
// ============================================

export interface SystemSettings {
  totalSharesTarget: number;
}

// ============================================
// PUBLIC APARTMENT TYPES
// ============================================

export interface PublicApartment {
  id: number;
  apartmentNumber: string;
  ownerFirstName: string | null;  // ⭐ Zmienione z ? na | null
  ownerLastName: string | null;   // ⭐ Zmienione z ? na | null
  phoneNumber: string | null;     // ⭐ Zmienione z ? na | null
  email: string | null;           // ⭐ Zmienione z ? na | null
  shareAmount: string | null;     // ⭐ Zmienione z ? na | null
  status: 'lease_agreement' | 'notice_sent' | 'collection_date' | 'collected' | 'smr' | null;  // ⭐ Dodano | null
  collectionDate: string | null;  // ⭐ Zmienione z ? na | null - NAPRAWIONO!
  additionalInfo: string | null;  // ⭐ Zmienione z ? na | null
  isLocked: boolean;              // ⭐ Zmienione z ? na type boolean (zawsze istnieje, domyślnie false)
  createdAt: string;
}

// ============================================
// APARTMENT STATS (dla widoku zbiorczego)
// ============================================

export interface ApartmentStats {
  id: number | null;  // ⭐ Zmienione z ? na | null
  number: string;
  shareAmount: string | null;     // ⭐ Zmienione z ? na | null
  additionalInfo: string | null;  // ⭐ Zmienione z ? na | null
  status: 'lease_agreement' | 'notice_sent' | 'collection_date' | 'collected' | 'smr' | null;  // ⭐ Dodano | null
  collectionDate: string | null;  // ⭐ Zmienione z ? na | null
  ownerName: string;
  ownerLogin: string | null;
  userId: string | null;          // ⭐ Zmienione z ? na | null
  source: 'user' | 'public';
  phoneNumber: string | null;     // ⭐ Zmienione z ? na | null
  email: string | null;           // ⭐ Zmienione z ? na | null
  ownerFirstName: string | null;  // ⭐ Zmienione z ? na | null
  ownerLastName: string | null;   // ⭐ Zmienione z ? na | null
  isLocked: boolean;              // ⭐ Zmienione z ? na type boolean
}

// ============================================
// EDIT HISTORY TYPES
// ============================================

export interface ApartmentEditHistory {
  id: number;
  apartmentId: number;
  changes: Record<string, any>;
  oldValues: Record<string, any>;
  editedBy: string;
  ipAddress: string;
  userAgent: string;
  editedAt: string;
}

// ============================================
// STATISTICS TYPES
// ============================================

export interface Statistics {
  totalUsers: number;
  totalApartments: number;
  totalEvents: number;
  apartmentsByStatus: Record<string, number>;
  recentActivity: Array<{
    type: 'user' | 'event' | 'apartment';
    action: string;
    timestamp: string;
  }>;
}

// ============================================
// TYPE ALIASES
// ============================================

export type ApartmentStatus = 
  | 'lease_agreement'
  | 'notice_sent'
  | 'collection_date'
  | 'collected'
  | 'smr'
  | null;

export type UserRole = 'admin' | 'user';

export type ApartmentSource = 'user' | 'public';
