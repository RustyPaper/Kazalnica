import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { createUser } from './databaseStorage';
import { User } from '../types';

export const migrateInitialData = async () => {
  console.log('🔄 Migracja początkowych danych...');

  try {
    // Utworzenie użytkownika admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser: User = {
      id: uuidv4(),
      login: 'admin',
      password: adminPassword,
      firstName: 'Administrator',
      lastName: 'System',
      apartments: [
        {
          number: 'D.3.21',
          shareAmount: '76',
          additionalInfo: 'Widok na hotel. Krótki balkon. Parking nr 63',
          status: 'lease_agreement',
          collectionDate: null
        }
      ],
      role: 'admin',
      permissions: {
        viewCalendar: true,
        addEvent: true,
        deleteEvent: true
      },
      phoneNumber: '',
      email: ''
    };

    await createUser(adminUser);
    console.log('✅ Utworzono użytkownika admin (login: admin, hasło: admin123)');

    // Tutaj możesz dodać więcej użytkowników jeśli masz
    
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation - user already exists
      console.log('ℹ️  Użytkownik admin już istnieje');
    } else {
      console.error('❌ Błąd migracji danych:', error);
      throw error;
    }
  }
};
