// DEBUG - wyświetl to w konsoli
console.log('🔧 Config loading...');
console.log('VITE_API_URL from env:', import.meta.env.VITE_API_URL);
console.log('MODE:', import.meta.env.MODE);
console.log('PROD:', import.meta.env.PROD);

// API URL - automatyczna detekcja środowiska
export const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://kazalnica.onrender.com/api'  // Produkcja - backend
    : 'http://localhost:3000/api');         // Development - lokalny backend

console.log('🔧 Final API_URL:', API_URL);

export const APP_NAME = 'Kalendarz Apartamentów';
export const VERSION = '1.0.0';
