"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fileStorage_1 = require("../utils/fileStorage");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Export events as JSON
router.get('/events/json', auth_1.authenticateToken, (req, res) => {
    try {
        const events = (0, fileStorage_1.readJSON)('events.json');
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=events.json');
        res.json(events);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd eksportu' });
    }
});
// Export events as CSV
router.get('/events/csv', auth_1.authenticateToken, (req, res) => {
    try {
        const events = (0, fileStorage_1.readJSON)('events.json');
        const csvHeader = 'ID,Data,Numer Apartamentu,Opis,Utworzono przez,Data utworzenia\n';
        const csvRows = events.map(e => `"${e.id}","${e.date}","${e.apartmentNumber}","${e.description || ''}","${e.createdBy}","${e.createdAt}"`).join('\n');
        const csv = csvHeader + csvRows;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=wydarzenia.csv');
        res.send('\ufeff' + csv); // UTF-8 BOM for Excel compatibility
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd eksportu' });
    }
});
// Export events for a specific month
router.get('/events/month/:year/:month', auth_1.authenticateToken, (req, res) => {
    try {
        const { year, month } = req.params;
        const events = (0, fileStorage_1.readJSON)('events.json');
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const endDate = `${year}-${month.padStart(2, '0')}-31`;
        const monthEvents = events.filter(e => e.date >= startDate && e.date <= endDate);
        res.json(monthEvents);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd eksportu' });
    }
});
// Export users (admin only)
router.get('/users/json', auth_1.authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Brak uprawnień' });
    }
    try {
        const users = (0, fileStorage_1.readJSON)('users.json');
        const usersWithoutPasswords = users.map(({ password, ...user }) => user);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=users.json');
        res.json(usersWithoutPasswords);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd eksportu' });
    }
});
exports.default = router;
