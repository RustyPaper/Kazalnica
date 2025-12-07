export interface Holiday {
  date: string;
  name: string;
}

export const getPolishHolidays = (year: number): Holiday[] => {
  const holidays: Holiday[] = [
    { date: `${year}-01-01`, name: 'Nowy Rok' },
    { date: `${year}-01-06`, name: 'Święto Trzech Króli' },
    { date: `${year}-05-01`, name: 'Święto Państwowe' },
    { date: `${year}-05-03`, name: 'Święto Narodowe Trzeciego Maja' },
    { date: `${year}-08-15`, name: 'Wniebowzięcie Najświętszej Maryi Panny' },
    { date: `${year}-11-01`, name: 'Wszystkich Świętych' },
    { date: `${year}-11-11`, name: 'Narodowe Święto Niepodległości' },
    { date: `${year}-12-25`, name: 'Boże Narodzenie' },
    { date: `${year}-12-26`, name: 'Drugi dzień Bożego Narodzenia' },
  ];

  // Easter calculation (Meeus/Jones/Butcher algorithm)
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

  const easter = new Date(year, month - 1, day);
  
  // Easter Sunday
  holidays.push({
    date: easter.toISOString().split('T')[0],
    name: 'Wielkanoc'
  });

  // Easter Monday
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  holidays.push({
    date: easterMonday.toISOString().split('T')[0],
    name: 'Poniedziałek Wielkanocny'
  });

  // Pentecost (49 days after Easter)
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 49);
  holidays.push({
    date: pentecost.toISOString().split('T')[0],
    name: 'Zielone Świątki'
  });

  // Corpus Christi (60 days after Easter)
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);
  holidays.push({
    date: corpusChristi.toISOString().split('T')[0],
    name: 'Boże Ciało'
  });

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
};
