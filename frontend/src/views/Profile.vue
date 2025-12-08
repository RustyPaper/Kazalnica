<template>
  <div class="container">
    <div class="card profile-card">
      <div class="profile-header">
        <h2>👤 Profil użytkownika</h2>
        <p>Zarządzaj swoimi danymi</p>
        
        <!-- Indicator synchronizacji -->
        <div class="sync-indicator" v-if="isSyncing">
          <span class="spinner"></span> Synchronizacja danych...
        </div>
      </div>
      
      <form @submit.prevent="handleUpdate">
        <div class="form-section">
          <h3>Dane logowania</h3>
          
          <div class="form-group">
            <label>Login</label>
            <input type="text" :value="authStore.user?.login" disabled />
            <small>Login nie może być zmieniony</small>
          </div>
          
          <div class="form-group">
            <label>Nowe hasło</label>
            <input 
              type="password" 
              v-model="formData.password" 
              placeholder="Zostaw puste, aby nie zmieniać"
              autocomplete="new-password"
            />
            <small>Pozostaw puste, jeśli nie chcesz zmieniać hasła</small>
          </div>
        </div>

        <div class="form-section">
          <h3>Dane osobowe</h3>
          
          <div class="form-group">
            <label>
              Imię <span class="required">*</span>
            </label>
            <input type="text" v-model="formData.firstName" required />
          </div>
          
          <div class="form-group">
            <label>Nazwisko</label>
            <input type="text" v-model="formData.lastName" />
          </div>
        </div>
        
        <div class="form-section">
          <div class="section-header">
            <h3>Lokale</h3>
            <button 
              type="button" 
              class="btn btn-secondary btn-sm" 
              @click="addApartment"
            >
              + Dodaj lokal
            </button>
          </div>
          
          <div 
            v-for="(apartment, index) in formData.apartments" 
            :key="index" 
            class="apartment-card"
          >
            <div class="apartment-header">
              <h4>Lokal {{ index + 1 }}</h4>
              <button
                v-if="formData.apartments.length > 1"
                type="button"
                class="btn-remove"
                @click="removeApartment(index)"
                title="Usuń lokal"
              >
                ✕
              </button>
            </div>
            
            <div class="form-group">
              <label>
                Numer lokalu <span class="required">*</span>
              </label>
              <input type="text" v-model="apartment.number" required />
            </div>
            
            <div class="form-group">
              <label>Wysokość udziałów w częściach wspólnych</label>
              <input 
                type="text" 
                v-model="apartment.shareAmount" 
                placeholder="np. 250.50" 
              />
              <small>Znajduje się w Akcie notarialnym w §1 pkt 1</small>
            </div>
            
            <div class="form-group">
              <label>Status lokalu</label>
              <select v-model="apartment.status">
                <option :value="undefined">Nie wybrano</option>
                <option value="lease_agreement">Umowa dzierżawy</option>
                <option value="notice_sent">Wysłane wezwanie</option>
                <option value="collection_date">Odbieram w dniu</option>
                <option value="collected">Odebrane</option>
              </select>
            </div>
            
            <div class="form-group" v-if="apartment.status === 'collection_date'">
              <label>Data odbioru</label>
              <input type="date" v-model="apartment.collectionDate" />
            </div>
            
            <div class="form-group">
              <label>Dodatkowe informacje</label>
              <textarea 
                v-model="apartment.additionalInfo" 
                rows="3"
                placeholder="np. Widok na hotel, Parking nr 63"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Dane kontaktowe</h3>
          
          <div class="form-group">
            <label>Numer telefonu</label>
            <input 
              type="tel" 
              v-model="formData.phoneNumber" 
              placeholder="+48 123 456 789"
            />
          </div>
          
          <div class="form-group">
            <label>E-mail</label>
            <input 
              type="email" 
              v-model="formData.email" 
              placeholder="email@example.com"
            />
          </div>
        </div>
        
        <div class="success" v-if="success">{{ success }}</div>
        <div class="error" v-if="error">{{ error }}</div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary btn-block" :disabled="isSyncing">
            {{ isSyncing ? '⏳ Zapisywanie...' : '💾 Zapisz zmiany' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import type { Apartment } from '../types';

const authStore = useAuthStore();

const formData = ref({
  firstName: '',
  lastName: '',
  apartments: [] as Apartment[],
  phoneNumber: '',
  email: '',
  password: '',
});

const error = ref('');
const success = ref('');
const isSyncing = ref(false);
let refreshInterval: number | null = null;

// Auto-refresh co 30 sekund
const startAutoRefresh = () => {
  refreshInterval = window.setInterval(async () => {
    console.log('🔄 Auto-refresh danych profilu...');
    await authStore.fetchProfile();
    
    // Zaktualizuj formularz jeśli użytkownik nie edytuje
    if (document.activeElement?.tagName !== 'INPUT' && 
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT') {
      formData.value.apartments = JSON.parse(JSON.stringify(authStore.user?.apartments || []));
    }
  }, 30000); // 30 sekund
};

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

onMounted(() => {
  if (authStore.user) {
    formData.value = {
      firstName: authStore.user.firstName,
      lastName: authStore.user.lastName || '',
      apartments: JSON.parse(JSON.stringify(authStore.user.apartments)),
      phoneNumber: authStore.user.phoneNumber || '',
      email: authStore.user.email || '',
      password: '',
    };
  }
  
  // Uruchom auto-refresh
  startAutoRefresh();
});

onUnmounted(() => {
  // Zatrzymaj auto-refresh gdy komponent zostanie zniszczony
  stopAutoRefresh();
});

const addApartment = () => {
  formData.value.apartments.push({
    number: '',
    shareAmount: '',
    additionalInfo: '',
    status: undefined,
    collectionDate: ''
  });
};

const removeApartment = (index: number) => {
  formData.value.apartments.splice(index, 1);
};

const handleUpdate = async () => {
  error.value = '';
  success.value = '';
  isSyncing.value = true;
  
  const validApartments = formData.value.apartments.filter(apt => apt.number.trim() !== '');
  
  if (validApartments.length === 0) {
    error.value = 'Musisz podać przynajmniej jeden numer lokalu';
    isSyncing.value = false;
    return;
  }
  
  try {
    // KROK 1: Pobierz najnowsze dane z serwera
    console.log('🔄 Synchronizuję dane z serwera...');
    const fetchResult = await authStore.fetchProfile();
    
    if (!fetchResult.success) {
      error.value = 'Błąd synchronizacji. Spróbuj ponownie.';
      isSyncing.value = false;
      return;
    }
    
    // KROK 2: Merguj apartamenty
    const serverApartments = authStore.user?.apartments || [];
    const localApartments = validApartments;
    
    // Utwórz mapę po numerach apartamentów
    const apartmentMap = new Map();
    
    // Najpierw dodaj wszystkie z serwera
    serverApartments.forEach(apt => {
      apartmentMap.set(apt.number, apt);
    });
    
    // Potem nadpisz/dodaj lokalne zmiany
    localApartments.forEach(apt => {
      apartmentMap.set(apt.number, apt);
    });
    
    // Zamień z powrotem na tablicę
    const mergedApartments = Array.from(apartmentMap.values());
    
    console.log('📊 Apartamenty przed merge:', serverApartments.length);
    console.log('📊 Apartamenty lokalne:', localApartments.length);
    console.log('📊 Apartamenty po merge:', mergedApartments.length);
    
    // KROK 3: Przygotuj dane do zapisu
    const updateData: any = {
      firstName: formData.value.firstName,
      lastName: formData.value.lastName,
      apartments: mergedApartments, // Zmergowane dane
      phoneNumber: formData.value.phoneNumber,
      email: formData.value.email,
    };
    
    if (formData.value.password) {
      updateData.password = formData.value.password;
    }
    
    // KROK 4: Zapisz na serwerze
    console.log('💾 Zapisuję zmienione dane...');
    const result = await authStore.updateProfile(updateData);
    
    if (result.success) {
      success.value = '✅ Profil został zaktualizowany (zsynchronizowano z serwerem)';
      formData.value.password = '';
      
      // KROK 5: Odśwież formularz z najnowszymi danymi
      formData.value.apartments = JSON.parse(JSON.stringify(authStore.user?.apartments || []));
      
      setTimeout(() => {
        success.value = '';
      }, 5000);
    } else {
      error.value = result.error || 'Błąd aktualizacji profilu';
    }
  } catch (err: any) {
    console.error('Update error:', err);
    error.value = 'Błąd synchronizacji danych. Odśwież stronę i spróbuj ponownie.';
  } finally {
    isSyncing.value = false;
  }
};
</script>

<style scoped>
.profile-card {
  max-width: 700px;
  margin: 30px auto;
}

.profile-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
  position: relative;
}

.profile-header h2 {
  margin-bottom: 10px;
  font-size: 28px;
}

.profile-header p {
  color: #666;
  font-size: 14px;
}

.sync-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #007bff;
  font-size: 14px;
  margin-top: 10px;
  padding: 8px;
  background-color: #e7f3ff;
  border-radius: 4px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.form-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h3 {
  margin-bottom: 15px;
  color: #343a40;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
  min-width: auto;
}

.apartment-card {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
  position: relative;
}

.apartment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.apartment-header h4 {
  margin: 0;
  font-size: 16px;
  color: #495057;
}

.btn-remove {
  background-color: #dc3545;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-remove:hover {
  background-color: #c82333;
  transform: scale(1.1);
}

.form-actions {
  margin-top: 30px;
}

.btn-block {
  width: 100%;
}

.btn-block:disabled {
  opacity: 0.7;
  cursor: wait;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .profile-card {
    margin: 15px auto;
  }

  .profile-header h2 {
    font-size: 24px;
  }

  .sync-indicator {
    font-size: 13px;
  }

  .spinner {
    width: 14px;
    height: 14px;
  }

  .form-section h3 {
    font-size: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .btn-sm {
    width: 100%;
  }

  .apartment-card {
    padding: 12px;
  }

  .apartment-header {
    gap: 10px;
  }

  .apartment-header h4 {
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .profile-header h2 {
    font-size: 20px;
  }

  .form-section {
    margin-bottom: 20px;
  }
}
</style>

