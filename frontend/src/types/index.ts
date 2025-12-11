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
    canEditPublicApartments?: boolean; // NOWE
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

export interface Holiday {
  date: string;
  name: string;
  isHighSeason?: boolean;
}

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface RegisterData {
  login: string;
  password: string;
  firstName: string;
  lastName?: string;
  apartments: Apartment[];
  phoneNumber?: string;
  email?: string;
}

export interface SystemSettings {
  totalSharesTarget: number;
}

// NOWE: Typ dla apartamentów w statystykach (z informacją o właścicielu i źródle)
export interface ApartmentStats {
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
}

// NOWE: Typ dla publicznych apartamentów (bez powiązania z kontem)
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

export interface ApartmentStatistics {
  totalSharesTarget: number;
  totalShares: number;
  sharePercentage: number;
  totalApartments: number;
  apartments: ApartmentStats[]; // ZMIENIONO: użyj ApartmentStats zamiast Apartment & {...}
  statusGroups: {
    lease_agreement: ApartmentStats[];
    notice_sent: ApartmentStats[];
    collection_date: ApartmentStats[];
    collected: ApartmentStats[];
    no_status: ApartmentStats[];
  };
  statusCounts: {
    lease_agreement: number;
    notice_sent: number;
    collection_date: number;
    collected: number;
    no_status: number;
  };
  sourceCounts?: { // NOWE: opcjonalne statystyki źródeł
    user: number;
    public: number;
  };
}
