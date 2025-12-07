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
