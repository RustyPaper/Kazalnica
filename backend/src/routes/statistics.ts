import express, { Response, Request } from 'express';
import { AuthRequest, ApartmentStats } from '../types';
import { getAllUsers, getSetting, getUserById, updateUser } from '../utils/databaseStorage';
import { getAllPublicApartments } from '../utils/publicApartmentsStorage';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 🆕 Funkcja sortująca lokale wg formatu D.x.x
const sortApartmentsByNumber = (apartments: ApartmentStats[]): ApartmentStats[] => {
  return apartments.sort((a, b) => {
    const numberA = a.number.trim().toUpperCase();
    const numberB = b.number.trim().toUpperCase();

    // Parsuj format D.x.x lub D.x.Ux
    const parseApartmentNumber = (num: string) => {
      // Usuń spacje
      const cleaned = num.replace(/\s+/g, '');
      
      // Sprawdź czy pasuje do formatu D.x.x lub D.x.Ux
      const match = cleaned.match(/^D\.(-?\d+)\.(.+)$/i);
      
      if (!match) {
        // Jeśli nie pasuje do formatu, zwróć wartości które wyślą na koniec
        return { floor: 999, room: 999, isU: false, original: num };
      }

      const floor = parseInt(match[1], 10);
      const roomPart = match[2];

      // Sprawdź czy to format "Ux" (np. U12)
      const isU = /^U\d+$/i.test(roomPart);
      
      if (isU) {
        // Format D.x.Ux - wyślij na koniec
        const roomNumber = parseInt(roomPart.substring(1), 10);
        return { floor, room: roomNumber, isU: true, original: num };
      }

      // Standardowy format D.x.x
      const room = parseInt(roomPart, 10);
      
      if (isNaN(room)) {
        // Jeśli druga część nie jest liczbą, wyślij na koniec
        return { floor, room: 999, isU: false, original: num };
      }

      return { floor, room, isU: false, original: num };
    };

    const parsedA = parseApartmentNumber(numberA);
    const parsedB = parseApartmentNumber(numberB);

    // Sortowanie:
    // 1. D.x.Ux na końcu (isU = true)
    if (parsedA.isU && !parsedB.isU) return 1;
    if (!parsedA.isU && parsedB.isU) return -1;

    // 2. Sortuj wg piętra (floor)
    if (parsedA.floor !== parsedB.floor) {
      return parsedA.floor - parsedB.floor;
    }

    // 3. Sortuj wg numeru pokoju (room)
    if (parsedA.room !== parsedB.room) {
      return parsedA.room - parsedB.room;
    }

    // 4. Jeśli wszystko równe, sortuj alfabetycznie
    return parsedA.original.localeCompare(parsedB.original);
  });
};

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
          id: null,  // ⭐ DODANE - lokale użytkowników nie mają osobnego ID
          number: apt.number,
          shareAmount: apt.shareAmount,
          additionalInfo: apt.additionalInfo,
          status: apt.status,
          collectionDate: apt.collectionDate,
          ownerName: `${user.firstName} ${user.lastName || ''}`.trim(),
          ownerLogin: user.login,
          userId: user.id,
          source: 'user' as const,
          phoneNumber: user.phoneNumber,
          email: user.email,
          ownerFirstName: user.firstName,  // ⭐ DODANE
          ownerLastName: user.lastName,    // ⭐ DODANE
          isLocked: false
        });
      });
    });

    // Zbierz publiczne lokale
    const publicApartments = await getAllPublicApartments();
    publicApartments.forEach(apt => {
      allApartments.push({
        id: apt.id,
        number: apt.apartmentNumber,
        shareAmount: apt.shareAmount,
        additionalInfo: apt.additionalInfo,
        status: apt.status,
        collectionDate: apt.collectionDate,
        ownerName: `${apt.ownerFirstName ?? ''} ${apt.ownerLastName ?? ''}`.trim() || 'Brak danych',
        ownerLogin: null,
        userId: null,  // ⭐ DODANE - publiczne nie mają userId
        source: 'public' as const,
        phoneNumber: apt.phoneNumber,
        email: apt.email,
        ownerFirstName: apt.ownerFirstName,
        ownerLastName: apt.ownerLastName,
        isLocked: apt.isLocked
      });
    });

    // 🆕 POSORTUJ LOKALE
    const sortedApartments = sortApartmentsByNumber(allApartments);

    // Oblicz sumę udziałów
    let totalShares = 0;
    sortedApartments.forEach(apt => {
      const shareAmount = parseFloat(apt.shareAmount || '0');
      if (!isNaN(shareAmount)) {
        totalShares += shareAmount;
      }
    });

    // Grupuj według statusu
    const statusGroups = {
      lease_agreement: sortedApartments.filter(apt => apt.status === 'lease_agreement'),
      notice_sent: sortedApartments.filter(apt => apt.status === 'notice_sent'),
      collection_date: sortedApartments.filter(apt => apt.status === 'collection_date'),
      collected: sortedApartments.filter(apt => apt.status === 'collected'),
      smr: sortedApartments.filter(apt => apt.status === 'smr'),
      no_status: sortedApartments.filter(apt => !apt.status)
    };

    // Dolicz, ile z każdego źródła
    const sourceCounts = {
      user: sortedApartments.filter(apt => apt.source === 'user').length,
      public: sortedApartments.filter(apt => apt.source === 'public').length
    };

    const lockStats = {
      locked: sortedApartments.filter(apt => apt.isLocked === true).length,
      unlocked: sortedApartments.filter(apt => apt.isLocked === false || apt.isLocked === undefined).length
    };

    res.json({
      totalSharesTarget,
      totalShares,
      sharePercentage: totalSharesTarget > 0 ? (totalShares / totalSharesTarget) * 100 : 0,
      totalApartments: sortedApartments.length,
      apartments: sortedApartments,
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
      lockStats
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
