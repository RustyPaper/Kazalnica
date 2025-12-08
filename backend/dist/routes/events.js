"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const fileStorage_1 = require("../utils/fileStorage");
const auth_1 = require("../middleware/auth");
const holidays_1 = require("../utils/holidays");
const router = express_1.default.Router();
// Get holidays for a year
router.get('/holidays/:year', auth_1.authenticateToken, (0, auth_1.requirePermission)('viewCalendar'), (req, res) => {
    const year = parseInt(req.params.year);
    if (isNaN(year) || year < 2000 || year > 2100) {
        return res.status(400).json({ error: 'Nieprawidłowy rok' });
    }
    const holidays = (0, holidays_1.getPolishHolidays)(year);
    res.json(holidays);
});
// Get all events
router.get('/', auth_1.authenticateToken, (0, auth_1.requirePermission)('viewCalendar'), (req, res) => {
    const events = (0, fileStorage_1.readJSON)('events.json');
    res.json(events);
});
// Create event
router.post('/', auth_1.authenticateToken, (0, auth_1.requirePermission)('addEvent'), (req, res) => {
    try {
        const { date, apartmentNumber, description } = req.body;
        if (!date || !apartmentNumber) {
            return res.status(400).json({ error: 'Data i numer apartamentu są wymagane' });
        }
        const events = (0, fileStorage_1.readJSON)('events.json');
        const newEvent = {
            id: (0, uuid_1.v4)(),
            date,
            apartmentNumber,
            description,
            createdBy: req.user.id,
            createdAt: new Date().toISOString()
        };
        events.push(newEvent);
        (0, fileStorage_1.writeJSON)('events.json', events);
        res.status(201).json(newEvent);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});
// Delete event
router.delete('/:eventId', auth_1.authenticateToken, (0, auth_1.requirePermission)('deleteEvent'), (req, res) => {
    try {
        const { eventId } = req.params;
        const events = (0, fileStorage_1.readJSON)('events.json');
        const eventIndex = events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) {
            return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
        }
        events.splice(eventIndex, 1);
        (0, fileStorage_1.writeJSON)('events.json', events);
        res.json({ message: 'Wydarzenie usunięte' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});
// Update event
router.put('/:eventId', auth_1.authenticateToken, (0, auth_1.requirePermission)('addEvent'), (req, res) => {
    try {
        const { eventId } = req.params;
        const { date, apartmentNumber, description } = req.body;
        const events = (0, fileStorage_1.readJSON)('events.json');
        const eventIndex = events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) {
            return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
        }
        // Check if user created the event or is admin
        const isAdmin = req.user.role === 'admin';
        const isOwner = events[eventIndex].createdBy === req.user.id;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Brak uprawnień do edycji tego wydarzenia' });
        }
        if (date)
            events[eventIndex].date = date;
        if (apartmentNumber)
            events[eventIndex].apartmentNumber = apartmentNumber;
        if (description !== undefined)
            events[eventIndex].description = description;
        (0, fileStorage_1.writeJSON)('events.json', events);
        res.json(events[eventIndex]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});
exports.default = router;
