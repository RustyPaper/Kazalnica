export interface Holiday {
  date: string;
  name: string;
  isHighSeason?: boolean;
}

// Obliczanie Wielkanocy (algorytm Gaussa) - zwraca datę w UTC
const calculateEaster = (year: number): Date => {
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

  // Tworzymy datę w UTC (południe, żeby uniknąć problemów ze strefami)
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
};

// Dodaj dni do daty UTC i zwróć string YYYY-MM-DD
const addDays = (date: Date, days: number): string => {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  
  const year = result.getUTCFullYear();
  const month = String(result.getUTCMonth() + 1).padStart(2, '0');
  const day = String(result.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Formatuj datę UTC do YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export const getPolishHolidays = (year: number): Holiday[] => {
  const holidays: Holiday[] = [
    { date: `${year}-01-01`, name: 'Nowy Rok' },
    { date: `${year}-01-06`, name: 'Święto Trzech Króli' },
    { date: `${year}-05-01`, name: 'Święto Państwowe' },
    { date: `${year}-05-03`, name: 'Święto Narodowe Trzeciego Maja' },
    { date: `${year}-08-15`, name: 'Wniebowzięcie Najświętszej Maryi Panny' },
    { date: `${year}-11-01`, name: 'Wszystkich Świętych' },
    { date: `${year}-11-11`, name: 'Narodowe Święto Niepodległości' },
    { date: `${year}-12-06`, name: 'Mikołajki' },
    { date: `${year}-12-25`, name: 'Boże Narodzenie' },
    { date: `${year}-12-26`, name: 'Drugi dzień Bożego Narodzenia' },
  ];

  // Wielkanoc i święta ruchome
  const easter = calculateEaster(year);
  
  // Wielki Piątek (2 dni przed Wielkanocą)
  holidays.push({
    date: addDays(easter, -2),
    name: 'Wielki Piątek',
    isHighSeason: true
  });

  // Wielka Sobota (1 dzień przed Wielkanocą)
  holidays.push({
    date: addDays(easter, -1),
    name: 'Wielka Sobota',
    isHighSeason: true
  });

  // Niedziela Wielkanocna
  holidays.push({
    date: formatDate(easter),
    name: 'Wielkanoc',
    isHighSeason: true
  });

  // Poniedziałek Wielkanocny
  holidays.push({
    date: addDays(easter, 1),
    name: 'Poniedziałek Wielkanocny',
    isHighSeason: true
  });

  // Zielone Świątki (49 dni po Wielkanocy)
  holidays.push({
    date: addDays(easter, 49),
    name: 'Zielone Świątki'
  });

  // Boże Ciało (60 dni po Wielkanocy)
  const corpusChristiDate = addDays(easter, 60);
  holidays.push({
    date: corpusChristiDate,
    name: 'Boże Ciało',
    isHighSeason: true
  });

  // Dzień przed Bożym Ciałem
  holidays.push({
    date: addDays(easter, 59),
    name: 'Dzień przed Bożym Ciałem',
    isHighSeason: true
  });

  // Dzień po Bożym Ciele
  holidays.push({
    date: addDays(easter, 61),
    name: 'Dzień po Bożym Ciele',
    isHighSeason: true
  });

  // Dni wokół Wszystkich Świętych
  holidays.push({
    date: `${year}-10-31`,
    name: 'Dzień przed Wszystkimi Świętymi',
    isHighSeason: true
  });
  
  holidays.push({
    date: `${year}-11-02`,
    name: 'Dzień po Wszystkich Świętych',
    isHighSeason: true
  });

  // Dni wokół Święta Niepodległości
  holidays.push({
    date: `${year}-11-10`,
    name: 'Dzień przed Świętem Niepodległości',
    isHighSeason: true
  });
  
  holidays.push({
    date: `${year}-11-12`,
    name: 'Dzień po Święcie Niepodległości',
    isHighSeason: true
  });

  // Dni wokół Mikołajek
  holidays.push({
    date: `${year}-12-05`,
    name: 'Dzień przed Mikołajkami',
    isHighSeason: true
  });
  
  holidays.push({
    date: `${year}-12-07`,
    name: 'Dzień po Mikołajkach',
    isHighSeason: true
  });

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
};

// Sprawdza czy data jest w sezonie wysokim
export const isHighSeason = (dateString: string): boolean => {
  // Parsuj datę jako YYYY-MM-DD (UTC)
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr); // 1-12
  const day = parseInt(dayStr);

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

  // Sprawdź święta oznaczone jako sezon wysoki
  const holidays = getPolishHolidays(year);
  const holiday = holidays.find(h => h.date === dateString && h.isHighSeason);
  
  return !!holiday;
};
