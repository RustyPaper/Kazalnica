import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const readJSON = <T>(filename: string): T => {
  const filepath = path.join(DATA_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    return [] as unknown as T;
  }
  
  const data = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(data);
};

export const writeJSON = <T>(filename: string, data: T): void => {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
};
