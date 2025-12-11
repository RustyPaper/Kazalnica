export interface Apartment {
  number: string;
  shareAmount?: string;
  additionalInfo?: string;
  status?: 'lease_agreement' | 'notice_sent' | 'collection_date' | 'collected' | 'smr'; // DODANE
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

export interface ApartmentStats {
  id?: number;
  number: string;
  shareAmount?: string;
  additionalInfo?: string;
  status?: 'lease_agreement' | 'notice_sent' | 'collection_date' | 'collected' | 'smr'; // DODANE
  collectionDate?: string;
  ownerName: string;
  ownerLogin: string | null;
  source: 'user' | 'public';
  phoneNumber?: string;
  email?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
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
  apartments: ApartmentStats[];
  statusGroups: {
    lease_agreement: ApartmentStats[];
    notice_sent: ApartmentStats[];
    collection_date: ApartmentStats[];
    collected: ApartmentStats[];
    smr: ApartmentStats[]; // DODANE
    no_status: ApartmentStats[];
  };
  statusCounts: {
    lease_agreement: number;
    notice_sent: number;
    collection_date: number;
    collected: number;
    smr: number; // DODANE
    no_status: number;
  };
  sourceCounts?: {
    user: number;
    public: number;
  };
}
