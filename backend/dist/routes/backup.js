"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const backup_1 = require("../utils/backup");
const router = express_1.default.Router();
// Admin only - create manual backup
router.post('/create', auth_1.authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Tylko administrator może tworzyć kopie zapasowe' });
    }
    try {
        const backupPath = (0, backup_1.createBackup)();
        res.json({
            message: 'Kopia zapasowa utworzona',
            path: backupPath,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Admin only - list backups
router.get('/list', auth_1.authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Tylko administrator może przeglądać kopie zapasowe' });
    }
    try {
        const backups = (0, backup_1.listBackups)();
        res.json(backups);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Admin only - restore backup
router.post('/restore/:backupName', auth_1.authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Tylko administrator może przywracać kopie zapasowe' });
    }
    try {
        const { backupName } = req.params;
        (0, backup_1.restoreBackup)(backupName);
        res.json({ message: 'Kopia zapasowa przywrócona' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
