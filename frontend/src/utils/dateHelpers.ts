// Stare funkcje formatujące (muszą zostać!)
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isSameDay = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

export const addDays = (dateString: string, days: number): string => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const subtractDays = (dateString: string, days: number): string => {
  return addDays(dateString, -days);
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Nowe funkcje do sezonu wysokiego
// Sprawdza czy data jest w sezonie wysokim
export const isHighSeason = (dateString: string): boolean => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // 1 lipiec - 15 sierpień
  if ((month === 7 && day >= 1) || (month === 8 && day <= 15)) {
    return true;
  }

  // 24 grudzień - 15 luty
  if (month === 12 && day >= 24) {
    return true;
  }
  if (month === 1 || (month === 2 && day <= 15)) {
    return true;
  }

  // 27 kwietnia - 6 maja
  if ((month === 4 && day >= 27) || (month === 5 && day <= 6)) {
    return true;
  }

  return false;
};

// Obliczanie Wielkanocy (algorytm Gaussa)
export const calculateEaster = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
};

// Sprawdza czy data jest w okresie świąt wielkanocnych (piątek-poniedziałek)
export const isEasterPeriod = (dateString: string): boolean => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const easter = calculateEaster(year);
  
  // Wielki Piątek (2 dni przed)
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  
  // Poniedziałek Wielkanocny (1 dzień po)
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  
  return date >= goodFriday && date <= easterMonday;
};

// Sprawdza czy data jest w okolicach Bożego Ciała (dzień przed i po)
export const isCorpusChristiPeriod = (dateString: string): boolean => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const easter = calculateEaster(year);
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);
  
  const dayBefore = new Date(corpusChristi);
  dayBefore.setDate(corpusChristi.getDate() - 1);
  
  const dayAfter = new Date(corpusChristi);
  dayAfter.setDate(corpusChristi.getDate() + 1);
  
  return date >= dayBefore && date <= dayAfter;
};

// Sprawdza czy data jest w okolicach danego święta (dzień przed i po)
export const isAroundHoliday = (dateString: string, holidayMonth: number, holidayDay: number): boolean => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if (month !== holidayMonth) return false;
  
  return day >= (holidayDay - 1) && day <= (holidayDay + 1);
};

// Kompletna funkcja sprawdzająca sezon wysoki (uwzględnia wszystkie święta ruchome)
export const isHighSeasonComplete = (dateString: string): boolean => {
  // Sprawdź podstawowe okresy
  if (isHighSeason(dateString)) {
    return true;
  }

  // Wielkanoc (piątek-poniedziałek)
  if (isEasterPeriod(dateString)) {
    return true;
  }

  // Boże Ciało (dzień przed i po)
  if (isCorpusChristiPeriod(dateString)) {
    return true;
  }

  // Wszystkich Świętych (31.10 - 02.11)
  if (isAroundHoliday(dateString, 11, 1)) {
    return true;
  }

  // Święto Niepodległości (10.11 - 12.11)
  if (isAroundHoliday(dateString, 11, 11)) {
    return true;
  }

  // Mikołajki (05.12 - 07.12)
  if (isAroundHoliday(dateString, 12, 6)) {
    return true;
  }

  return false;
};
