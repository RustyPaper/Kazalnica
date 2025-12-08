"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = void 0;
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const fileStorage_1 = require("../utils/fileStorage");
const router = express_1.default.Router();
const JWT_SECRET = 'your-secret-key-change-in-production';
exports.JWT_SECRET = JWT_SECRET;
// Initialize with hardcoded admin
const initializeAdmin = () => {
    let users = (0, fileStorage_1.readJSON)('users.json');
    if (!Array.isArray(users)) {
        users = [];
    }
    const adminExists = users.some(u => u.role === 'admin');
    if (!adminExists) {
        const hashedPassword = bcrypt_1.default.hashSync('admin123', 10);
        const admin = {
            id: (0, uuid_1.v4)(),
            login: 'admin',
            password: hashedPassword,
            firstName: 'Administrator',
            lastName: 'System',
            apartments: [],
            role: 'admin',
            permissions: {
                viewCalendar: true,
                addEvent: true,
                deleteEvent: true,
            }
        };
        users.push(admin);
        (0, fileStorage_1.writeJSON)('users.json', users);
        console.log('✓ Admin account created - Login: admin, Password: admin123');
    }
};
initializeAdmin();
// Register
router.post('/register', async (req, res) => {
    try {
        const { login, password, firstName, lastName, apartments, phoneNumber, email } = req.body;
        if (!login || !password || !firstName || !apartments || apartments.length === 0) {
            return res.status(400).json({ error: 'Wypełnij wszystkie wymagane pola' });
        }
        const users = (0, fileStorage_1.readJSON)('users.json');
        if (users.some(u => u.login.toLowerCase() === login.toLowerCase())) {
            return res.status(400).json({ error: 'Login już istnieje' });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newUser = {
            id: (0, uuid_1.v4)(),
            login,
            password: hashedPassword,
            firstName,
            lastName,
            apartments,
            phoneNumber,
            email,
            role: 'user',
            permissions: {
                viewCalendar: true,
                addEvent: true,
                deleteEvent: false,
            }
        };
        users.push(newUser);
        (0, fileStorage_1.writeJSON)('users.json', users);
        const token = jsonwebtoken_1.default.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ token, user: userWithoutPassword });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});
// Login
router.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        if (!login || !password) {
            return res.status(400).json({ error: 'Login i hasło są wymagane' });
        }
        const users = (0, fileStorage_1.readJSON)('users.json');
        const user = users.find(u => u.login.toLowerCase() === login.toLowerCase());
        if (!user) {
            return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
        }
        const validPassword = await bcrypt_1.default.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        const { password: _, ...userWithoutPassword } = user;
        res.json({ token, user: userWithoutPassword });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});
exports.default = router;
