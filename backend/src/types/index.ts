import { Request } from 'express';

export interface Apartment {
  number: string;
  shareAmount?: string;
  additionalInfo?: string;
  status?: 'lease_agreement' | 'notice_sent' | 'collection_date' | 'collected';
  collectionDate?: string;
}

export interface User {
  id: string;
  login: string;
  password: string;
  firstName: string;
  lastName?: string;
  apartments: Apartment[];
  phoneNumber?: string;
  email?: string;
  role: 'admin' | 'user';
  permissions: {
    viewCalendar: boolean;
    addEvent: boolean;
    deleteEvent: boolean;
    canEditPublicApartments?: boolean;
  };
}

export interface Event {
  id: string;
  date: string;
  apartmentNumber: string;
  description?: string;
  createdBy: string;
  createdAt: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface SystemSettings {
  totalSharesTarget: number;
}

export interface PublicApartment {
  id: number;
  apartmentNumber: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  phoneNumber?: string;
  email?: string;
  shareAmount?: string;
  status?: 'lease_agreement' | 'notice_sent' | 'collection_date' | 'collected';
  collectionDate?: string;
  additionalInfo?: string;
  createdAt: string;
}

export interface ApartmentStats {
  id?: number; // DODANE: ID publicznego lokalu (opcjonalne, bo userzy nie mają)
  number: string;
  shareAmount?: string;
  additionalInfo?: string;
  status?: 'lease_agreement' | 'notice_sent' | 'collection_date' | 'collected';
  collectionDate?: string;
  ownerName: string;
  ownerLogin: string | null;
  source: 'user' | 'public';
  phoneNumber?: string;
  email?: string;
  ownerFirstName?: string; // DODANE: Dla edycji publicznych lokali
  ownerLastName?: string;  // DODANE: Dla edycji publicznych lokali
}


