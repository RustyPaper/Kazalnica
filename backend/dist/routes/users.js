"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const fileStorage_1 = require("../utils/fileStorage");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get current user profile
router.get('/profile', auth_1.authenticateToken, (req, res) => {
    const { password: _, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
});
// Update profile
router.put('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, apartments, phoneNumber, email, password } = req.body;
        const users = (0, fileStorage_1.readJSON)('users.json');
        const userIndex = users.findIndex(u => u.id === req.user.id);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        }
        const updatedUser = { ...users[userIndex] };
        if (firstName)
            updatedUser.firstName = firstName;
        if (lastName !== undefined)
            updatedUser.lastName = lastName;
        if (apartments)
            updatedUser.apartments = apartments;
        if (phoneNumber !== undefined)
            updatedUser.phoneNumber = phoneNumber;
        if (email !== undefined)
            updatedUser.email = email;
        if (password) {
            updatedUser.password = await bcrypt_1.default.hash(password, 10);
        }
        users[userIndex] = updatedUser;
        (0, fileStorage_1.writeJSON)('users.json', users);
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});
// Get all users (admin only)
router.get('/all', auth_1.authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Brak uprawnień' });
    }
    const users = (0, fileStorage_1.readJSON)('users.json');
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
});
exports.default = router;
