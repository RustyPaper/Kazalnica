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

export interface Holiday {
  date: string;
  name: string;
  isHighSeason?: boolean;
}

export interface ApartmentStatistics {
  totalSharesTarget: number;
  totalShares: number;
  sharePercentage: number;
  totalApartments: number;
  apartments: Array<Apartment & { ownerName: string; ownerLogin: string }>;
  statusGroups: {
    lease_agreement: Apartment[];
    notice_sent: Apartment[];
    collection_date: Apartment[];
    collected: Apartment[];
    no_status: Apartment[];
  };
  statusCounts: {
    lease_agreement: number;
    notice_sent: number;
    collection_date: number;
    collected: number;
    no_status: number;
  };
}
