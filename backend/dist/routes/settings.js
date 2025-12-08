"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fileStorage_1 = require("../utils/fileStorage");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get system settings
router.get('/', auth_1.authenticateToken, (req, res) => {
    try {
        let settings = (0, fileStorage_1.readJSON)('settings.json');
        if (!settings || typeof settings.totalSharesTarget === 'undefined') {
            settings = { totalSharesTarget: 10000 };
            (0, fileStorage_1.writeJSON)('settings.json', settings);
        }
        res.json(settings);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});
// Update system settings (admin only)
router.put('/', auth_1.authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Tylko administrator może zmieniać ustawienia' });
    }
    try {
        const { totalSharesTarget } = req.body;
        if (typeof totalSharesTarget !== 'number' || totalSharesTarget <= 0) {
            return res.status(400).json({ error: 'Nieprawidłowa wartość sumy udziałów' });
        }
        const settings = { totalSharesTarget };
        (0, fileStorage_1.writeJSON)('settings.json', settings);
        res.json(settings);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});
exports.default = router;
