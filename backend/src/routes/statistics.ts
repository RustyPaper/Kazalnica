import express, { Response, Request } from 'express';
import { AuthRequest, ApartmentStats } from '../types';
import { getAllUsers, getSetting, getUserById, updateUser } from '../utils/databaseStorage';
import { getAllPublicApartments } from '../utils/publicApartmentsStorage';
import { authenticateToken } from '../middleware/auth';

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
          userId: user.id, // ID użytkownika dla edycji przez admina
          source: "user",
          phoneNumber: user.phoneNumber,
          email: user.email,
          isLocked: false // 🆕 Lokale użytkowników nie są lockowane
        });
      });
    });

    // Zbierz publiczne lokale
    const publicApartments = await getAllPublicApartments();
    publicApartments.forEach(apt => {
      allApartments.push({
        id: apt.id, // ID dla edycji
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
        ownerFirstName: apt.ownerFirstName, // Dla edycji
        ownerLastName: apt.ownerLastName,   // Dla edycji
        isLocked: apt.isLocked || false      // 🆕 DODANE: Status blokady
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
      smr: allApartments.filter(apt => apt.status === 'smr'),
      no_status: allApartments.filter(apt => !apt.status)
    };

    // Dolicz, ile z każdego źródła
    const sourceCounts = {
      user: allApartments.filter(apt => apt.source === 'user').length,
      public: allApartments.filter(apt => apt.source === 'public').length
    };

    // 🆕 DODANE: Statystyki lockowania
    const lockStats = {
      locked: allApartments.filter(apt => apt.isLocked === true).length,
      unlocked: allApartments.filter(apt => apt.isLocked === false || apt.isLocked === undefined).length
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
        smr: statusGroups.smr.length,
        no_status: statusGroups.no_status.length
      },
      sourceCounts,
      lockStats // 🆕 DODANE: Statystyki lockowania
    });

  } catch (error) {
    console.error('Błąd pobierania statystyk:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Edycja apartamentu użytkownika (tylko admin)
router.put('/apartments/user/:userId/:apartmentNumber', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Sprawdź czy admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tylko admin może edytować lokale użytkowników' });
    }

    const { userId, apartmentNumber } = req.params;
    const updates = req.body;

    console.log('📝 Admin edytuje lokal użytkownika:', { userId, apartmentNumber, updates });

    // Pobierz użytkownika
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    // Znajdź apartament
    const aptIndex = user.apartments.findIndex(apt => apt.number === decodeURIComponent(apartmentNumber));
    if (aptIndex === -1) {
      return res.status(404).json({ error: 'Lokal nie znaleziony' });
    }

    // Zaktualizuj apartament
    user.apartments[aptIndex] = {
      number: updates.number !== undefined ? updates.number : user.apartments[aptIndex].number,
      shareAmount: updates.shareAmount !== undefined ? updates.shareAmount : user.apartments[aptIndex].shareAmount,
      status: updates.status !== undefined ? updates.status : user.apartments[aptIndex].status,
      collectionDate: updates.collectionDate !== undefined ? updates.collectionDate : user.apartments[aptIndex].collectionDate,
      additionalInfo: updates.additionalInfo !== undefined ? updates.additionalInfo : user.apartments[aptIndex].additionalInfo
    };

    console.log('💾 Zapisuję zaktualizowany lokal:', user.apartments[aptIndex]);

    // Zapisz w bazie
    const updatedUser = await updateUser(userId, { apartments: user.apartments });

    if (!updatedUser) {
      return res.status(500).json({ error: 'Błąd zapisu danych' });
    }

    console.log('✅ Lokal użytkownika zaktualizowany pomyślnie');

    res.json({
      message: 'Lokal użytkownika zaktualizowany',
      apartment: updatedUser.apartments[aptIndex],
      user: {
        id: updatedUser.id,
        login: updatedUser.login,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName
      }
    });
  } catch (error) {
    console.error('❌ Błąd edycji lokalu użytkownika:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
