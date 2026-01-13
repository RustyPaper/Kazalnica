import express, { Response } from 'express';
import { AuthRequest } from '../types';
import { getAllPublicApartments, updatePublicApartment, getPublicApartmentById } from '../utils/publicApartmentsStorage';
import { getAllUsers, getUserById, updateUser } from '../utils/databaseStorage';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Sprawdź czy lokal o danym numerze istnieje
router.get('/check/:apartmentNumber', async (req, res: Response) => {
  try {
    const apartmentNumber = decodeURIComponent(req.params.apartmentNumber).trim().toUpperCase();
    
    console.log(`🔍 Sprawdzam lokal: ${apartmentNumber}`);
    
    // Sprawdź w lokalach użytkowników
    const users = await getAllUsers();
    for (const user of users) {
      const userApartment = user.apartments.find(
        apt => apt.number.trim().toUpperCase() === apartmentNumber
      );
      
      if (userApartment) {
        return res.json({
          exists: true,
          source: 'user',
          owner: {
            id: user.id,
            name: `${user.firstName} ${user.lastName || ''}`.trim(),
            login: user.login
          },
          apartment: {
            number: userApartment.number,
            shareAmount: userApartment.shareAmount,
            status: userApartment.status,
            collectionDate: userApartment.collectionDate,
            additionalInfo: userApartment.additionalInfo
          }
        });
      }
    }
    
    // Sprawdź w publicznych lokalach
    const publicApartments = await getAllPublicApartments();
    const publicApartment = publicApartments.find(
      apt => apt.apartmentNumber.trim().toUpperCase() === apartmentNumber
    );
    
    if (publicApartment) {
      return res.json({
        exists: true,
        source: 'public',
        apartment: {
          id: publicApartment.id,
          number: publicApartment.apartmentNumber,
          ownerFirstName: publicApartment.ownerFirstName,
          ownerLastName: publicApartment.ownerLastName,
          phoneNumber: publicApartment.phoneNumber,
          email: publicApartment.email,
          shareAmount: publicApartment.shareAmount,
          status: publicApartment.status,
          collectionDate: publicApartment.collectionDate,
          additionalInfo: publicApartment.additionalInfo
        }
      });
    }
    
    // Lokal nie istnieje
    res.json({ exists: false });
    
  } catch (error) {
    console.error('❌ Błąd sprawdzania lokalu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Przejmij publiczny lokal na swoje konto
router.post('/claim/:publicApartmentId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const publicApartmentId = parseInt(req.params.publicApartmentId, 10);
    const userId = req.user!.id;
    
    console.log(`🔄 Użytkownik ${req.user!.login} przejmuje lokal #${publicApartmentId}`);
    
    // Pobierz publiczny lokal
    const publicApartment = await getPublicApartmentById(publicApartmentId);
    
    if (!publicApartment) {
      return res.status(404).json({ error: 'Lokal publiczny nie znaleziony' });
    }
    
    // Pobierz użytkownika
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    // Sprawdź czy użytkownik już nie ma tego lokalu
    const alreadyHas = user.apartments.some(
      apt => apt.number.trim().toUpperCase() === publicApartment.apartmentNumber.trim().toUpperCase()
    );
    
    if (alreadyHas) {
      return res.status(400).json({ error: 'Ten lokal jest już przypisany do Twojego konta' });
    }
    
    // Dane z requestu (jeśli użytkownik chce nadpisać)
    const updatesFromUser = req.body || {};
    
    // Merge danych: priorytet dla danych użytkownika
    const newApartment = {
      number: publicApartment.apartmentNumber,
      shareAmount: updatesFromUser.shareAmount || publicApartment.shareAmount || '',
      status: updatesFromUser.status || publicApartment.status,
      collectionDate: updatesFromUser.collectionDate || publicApartment.collectionDate || '',
      additionalInfo: updatesFromUser.additionalInfo || publicApartment.additionalInfo || ''
    };
    
    // Dodaj lokal do użytkownika
    const updatedApartments = [...user.apartments, newApartment];
    
    await updateUser(userId, { apartments: updatedApartments });
    
    // USUŃ publiczny wpis (żeby nie było duplikatu)
    const pool = (await import('../config/database')).default;
    await pool.query('DELETE FROM public_apartments WHERE id = $1', [publicApartmentId]);
    
    console.log(`✅ Lokal ${publicApartment.apartmentNumber} przejęty przez ${req.user!.login}`);
    
    res.json({
      message: 'Lokal został przypisany do Twojego konta',
      apartment: newApartment
    });
    
  } catch (error) {
    console.error('❌ Błąd przejmowania lokalu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Odepnij lokal od konta użytkownika i przenieś do publicznych (tylko admin)
router.post('/detach/:userId/:apartmentNumber', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Tylko admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tylko administrator może odpinać lokale' });
    }
    
    const { userId, apartmentNumber } = req.params;
    const decodedNumber = decodeURIComponent(apartmentNumber).trim();
    
    console.log(`🔓 Admin ${req.user!.login} odpina lokal ${decodedNumber} od użytkownika ${userId}`);
    
    // Pobierz użytkownika
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    // Znajdź lokal
    const apartmentIndex = user.apartments.findIndex(
      apt => apt.number.trim() === decodedNumber
    );
    
    if (apartmentIndex === -1) {
      return res.status(404).json({ error: 'Lokal nie znaleziony u tego użytkownika' });
    }
    
    const apartment = user.apartments[apartmentIndex];
    
    // Usuń lokal z konta użytkownika
    const updatedApartments = user.apartments.filter((_, idx) => idx !== apartmentIndex);
    await updateUser(userId, { apartments: updatedApartments });
    
    // Dodaj do publicznych
    const pool = (await import('../config/database')).default;
    await pool.query(
      `INSERT INTO public_apartments 
        (apartment_number, owner_first_name, owner_last_name, phone_number, email, share_amount, status, collection_date, additional_info)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        apartment.number,
        user.firstName,
        user.lastName || null,
        user.phoneNumber || null,
        user.email || null,
        apartment.shareAmount || null,
        apartment.status || null,
        apartment.collectionDate || null,
        apartment.additionalInfo || null
      ]
    );
    
    console.log(`✅ Lokal ${apartment.number} odpięty i przeniesiony do publicznych`);
    
    res.json({
      message: 'Lokal został odpięty i przeniesiony do publicznych',
      apartment: apartment
    });
    
  } catch (error) {
    console.error('❌ Błąd odpinania lokalu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
