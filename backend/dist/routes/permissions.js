"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fileStorage_1 = require("../utils/fileStorage");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Update user permissions (admin only)
router.put('/:userId', auth_1.authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Brak uprawnień' });
    }
    try {
        const { userId } = req.params;
        const { permissions } = req.body;
        const users = (0, fileStorage_1.readJSON)('users.json');
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        }
        if (users[userIndex].role === 'admin' && req.user.id !== userId) {
            return res.status(403).json({ error: 'Nie można modyfikować uprawnień admina' });
        }
        users[userIndex].permissions = {
            ...users[userIndex].permissions,
            ...permissions
        };
        (0, fileStorage_1.writeJSON)('users.json', users);
        const { password: _, ...userWithoutPassword } = users[userIndex];
        res.json(userWithoutPassword);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});
exports.default = router;
