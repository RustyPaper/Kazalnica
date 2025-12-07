// DEBUG - wyświetl to w konsoli
console.log('🔧 Config loading...');
console.log('VITE_API_URL from env:', import.meta.env.VITE_API_URL);

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('🔧 Final API_URL:', API_URL);

export const APP_NAME = 'Kalendarz Apartamentów';
export const VERSION = '1.0.0';
