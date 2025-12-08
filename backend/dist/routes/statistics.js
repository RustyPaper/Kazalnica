"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fileStorage_1 = require("../utils/fileStorage");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get apartments statistics
router.get('/apartments', auth_1.authenticateToken, (req, res) => {
    try {
        const users = (0, fileStorage_1.readJSON)('users.json');
        const settings = (0, fileStorage_1.readJSON)('settings.json');
        const totalSharesTarget = settings?.totalSharesTarget || 10000;
        // Zbierz wszystkie lokale ze wszystkich użytkowników
        const allApartments = [];
        users.forEach(user => {
            user.apartments.forEach(apt => {
                allApartments.push({
                    ...apt,
                    ownerName: `${user.firstName} ${user.lastName || ''}`.trim(),
                    ownerLogin: user.login
                });
            });
        });
        // Oblicz sumę udziałów
        let totalShares = 0;
        allApartments.forEach(apt => {
            const shareAmount = parseFloat(apt.shareAmount || '0');
            if (!isNaN(shareAmount)) {
                totalShares += shareAmount;
            }
        });
        // Grupuj według statusu
        const statusGroups = {
            lease_agreement: allApartments.filter(apt => apt.status === 'lease_agreement'),
            notice_sent: allApartments.filter(apt => apt.status === 'notice_sent'),
            collection_date: allApartments.filter(apt => apt.status === 'collection_date'),
            collected: allApartments.filter(apt => apt.status === 'collected'),
            no_status: allApartments.filter(apt => !apt.status)
        };
        res.json({
            totalSharesTarget,
            totalShares,
            sharePercentage: totalSharesTarget > 0 ? (totalShares / totalSharesTarget) * 100 : 0,
            totalApartments: allApartments.length,
            apartments: allApartments,
            statusGroups,
            statusCounts: {
                lease_agreement: statusGroups.lease_agreement.length,
                notice_sent: statusGroups.notice_sent.length,
                collection_date: statusGroups.collection_date.length,
                collected: statusGroups.collected.length,
                no_status: statusGroups.no_status.length
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});
exports.default = router;
