"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = exports.requirePermission = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fileStorage_1 = require("../utils/fileStorage");
const JWT_SECRET = 'your-secret-key-change-in-production';
exports.JWT_SECRET = JWT_SECRET;
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token wymagany' });
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Nieprawidłowy token' });
        }
        const users = (0, fileStorage_1.readJSON)('users.json');
        const user = users.find(u => u.id === decoded.userId);
        if (!user) {
            return res.status(403).json({ error: 'Użytkownik nie znaleziony' });
        }
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Nieautoryzowany' });
        }
        if (!req.user.permissions[permission] && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Brak uprawnień' });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
