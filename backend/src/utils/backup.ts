import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(__dirname, '../../backups');

export const createBackup = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  const dataPath = path.join(__dirname, '../../data');
  const files = ['users.json', 'events.json'];

  files.forEach(file => {
    const sourcePath = path.join(dataPath, file);
    const destPath = path.join(backupPath, file);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
    }
  });

  console.log(`✓ Backup created: ${backupPath}`);
  return backupPath;
};

export const restoreBackup = (backupName: string) => {
  const backupPath = path.join(BACKUP_DIR, backupName);

  if (!fs.existsSync(backupPath)) {
    throw new Error('Backup nie istnieje');
  }

  const dataPath = path.join(__dirname, '../../data');
  const files = ['users.json', 'events.json'];

  files.forEach(file => {
    const sourcePath = path.join(backupPath, file);
    const destPath = path.join(dataPath, file);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
    }
  });

  console.log(`✓ Backup restored: ${backupName}`);
};

export const listBackups = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    return [];
  }

  return fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('backup-'))
    .map(name => {
      const stats = fs.statSync(path.join(BACKUP_DIR, name));
      return {
        name,
        created: stats.birthtime,
        size: stats.size,
      };
    })
    .sort((a, b) => b.created.getTime() - a.created.getTime());
};

// Auto-backup on startup
export const setupAutoBackup = () => {
  createBackup();

  // Create daily backup at midnight
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 0, 0
  );
  const msToMidnight = night.getTime() - now.getTime();

  setTimeout(() => {
    createBackup();
    setInterval(createBackup, 24 * 60 * 60 * 1000); // Daily
  }, msToMidnight);
};
