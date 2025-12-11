import express, { Response, Request } from 'express';
import { ApartmentStats } from '../types';
import { getAllUsers, getSetting } from '../utils/databaseStorage';
import { getAllPublicApartments } from '../utils/publicApartmentsStorage';

const router = express.Router();

// Get apartments statistics - PUBLICZNE
router.get('/apartments', async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    const settingsData = await getSetting('totalSharesTarget');
    const totalSharesTarget = settingsData || 10000;

    // Zbierz wszystkie lokale użytkowników
    const allApartments: ApartmentStats[] = [];

    users.forEach(user => {
      user.apartments.forEach(apt => {
        allApartments.push({
          number: apt.number,
          shareAmount: apt.shareAmount,
          additionalInfo: apt.additionalInfo,
          status: apt.status,
          collectionDate: apt.collectionDate,
          ownerName: `${user.firstName} ${user.lastName || ''}`.trim(),
          ownerLogin: user.login,
          source: "user",
          phoneNumber: user.phoneNumber,
          email: user.email
        });
      });
    });

    // Zbierz publiczne lokale
    const publicApartments = await getAllPublicApartments();
    publicApartments.forEach(apt => {
      allApartments.push({
        id: apt.id, // DODANE: ID dla edycji
        number: apt.apartmentNumber,
        shareAmount: apt.shareAmount,
        additionalInfo: apt.additionalInfo,
        status: apt.status,
        collectionDate: apt.collectionDate,
        ownerName: `${apt.ownerFirstName ?? ''} ${apt.ownerLastName ?? ''}`.trim(),
        ownerLogin: null,
        source: "public",
        phoneNumber: apt.phoneNumber,
        email: apt.email,
        ownerFirstName: apt.ownerFirstName, // DODANE: Dla edycji
        ownerLastName: apt.ownerLastName     // DODANE: Dla edycji
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

    // Dolicz, ile z każdego źródła
    const sourceCounts = {
      user: allApartments.filter(apt => apt.source === 'user').length,
      public: allApartments.filter(apt => apt.source === 'public').length
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
      },
      sourceCounts
    });

  } catch (error) {
      console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;

