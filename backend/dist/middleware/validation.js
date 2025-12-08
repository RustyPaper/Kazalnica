"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEvent = exports.validateRegistration = void 0;
const validateRegistration = (req, res, next) => {
    const { login, password, firstName, apartments } = req.body;
    const errors = [];
    if (!login || login.trim().length < 3) {
        errors.push('Login musi mieć co najmniej 3 znaki');
    }
    if (!password || password.length < 6) {
        errors.push('Hasło musi mieć co najmniej 6 znaków');
    }
    if (!firstName || firstName.trim().length === 0) {
        errors.push('Imię jest wymagane');
    }
    if (!apartments || !Array.isArray(apartments) || apartments.length === 0) {
        errors.push('Musisz podać przynajmniej jeden lokal');
    }
    if (apartments && Array.isArray(apartments)) {
        apartments.forEach((apt, index) => {
            if (!apt.number || apt.number.trim().length === 0) {
                errors.push(`Numer lokalu #${index + 1} jest wymagany`);
            }
        });
    }
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Błędy walidacji',
            details: errors,
        });
    }
    next();
};
exports.validateRegistration = validateRegistration;
const validateEvent = (req, res, next) => {
    const { date, apartmentNumber } = req.body;
    const errors = [];
    if (!date) {
        errors.push('Data jest wymagana');
    }
    else {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            errors.push('Data musi być w formacie YYYY-MM-DD');
        }
    }
    if (!apartmentNumber || apartmentNumber.trim().length === 0) {
        errors.push('Numer apartamentu jest wymagany');
    }
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Błędy walidacji',
            details: errors,
        });
    }
    next();
};
exports.validateEvent = validateEvent;
