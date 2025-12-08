"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAutoBackup = exports.listBackups = exports.restoreBackup = exports.createBackup = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const BACKUP_DIR = path_1.default.join(__dirname, '../../backups');
const createBackup = () => {
    if (!fs_1.default.existsSync(BACKUP_DIR)) {
        fs_1.default.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupPath = path_1.default.join(BACKUP_DIR, `backup-${timestamp}`);
    if (!fs_1.default.existsSync(backupPath)) {
        fs_1.default.mkdirSync(backupPath, { recursive: true });
    }
    const dataPath = path_1.default.join(__dirname, '../../data');
    const files = ['users.json', 'events.json'];
    files.forEach(file => {
        const sourcePath = path_1.default.join(dataPath, file);
        const destPath = path_1.default.join(backupPath, file);
        if (fs_1.default.existsSync(sourcePath)) {
            fs_1.default.copyFileSync(sourcePath, destPath);
        }
    });
    console.log(`✓ Backup created: ${backupPath}`);
    return backupPath;
};
exports.createBackup = createBackup;
const restoreBackup = (backupName) => {
    const backupPath = path_1.default.join(BACKUP_DIR, backupName);
    if (!fs_1.default.existsSync(backupPath)) {
        throw new Error('Backup nie istnieje');
    }
    const dataPath = path_1.default.join(__dirname, '../../data');
    const files = ['users.json', 'events.json'];
    files.forEach(file => {
        const sourcePath = path_1.default.join(backupPath, file);
        const destPath = path_1.default.join(dataPath, file);
        if (fs_1.default.existsSync(sourcePath)) {
            fs_1.default.copyFileSync(sourcePath, destPath);
        }
    });
    console.log(`✓ Backup restored: ${backupName}`);
};
exports.restoreBackup = restoreBackup;
const listBackups = () => {
    if (!fs_1.default.existsSync(BACKUP_DIR)) {
        return [];
    }
    return fs_1.default.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('backup-'))
        .map(name => {
        const stats = fs_1.default.statSync(path_1.default.join(BACKUP_DIR, name));
        return {
            name,
            created: stats.birthtime,
            size: stats.size,
        };
    })
        .sort((a, b) => b.created.getTime() - a.created.getTime());
};
exports.listBackups = listBackups;
// Auto-backup on startup
const setupAutoBackup = () => {
    (0, exports.createBackup)();
    // Create daily backup at midnight
    const now = new Date();
    const night = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const msToMidnight = night.getTime() - now.getTime();
    setTimeout(() => {
        (0, exports.createBackup)();
        setInterval(exports.createBackup, 24 * 60 * 60 * 1000); // Daily
    }, msToMidnight);
};
exports.setupAutoBackup = setupAutoBackup;
