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
              <input type="text" v-model="apartment.number" required  @blur="checkDuplicate(apartment.number, index)"/>
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
                <option value="smr">SMR</option>
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
  <ApartmentDuplicateModal
  v-if="showDuplicateModal && duplicateData"
  :apartmentData="duplicateData"
  @close="showDuplicateModal = false"
  @claimed="onApartmentClaimed"
  @edit="onEditPublic"
/>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import type { Apartment } from '../types';
import axios from 'axios';
import { API_URL } from '../config';
import ApartmentDuplicateModal from '../components/ApartmentDuplicateModal.vue';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const formData = ref({
  firstName: '',
  lastName: '',
  apartments: [] as Apartment[],
  phoneNumber: '',
  email: '',
  password: '',
});

const isEditing = ref(false); // Flaga: czy użytkownik edytuje
const error = ref('');
const success = ref('');
const isSyncing = ref(false);
let refreshInterval: number | null = null;

// Stan dla modalu duplikatu
const showDuplicateModal = ref(false);
const duplicateData = ref<any>(null);

// Auto-refresh co 30 sekund
const startAutoRefresh = () => {
  refreshInterval = window.setInterval(async () => {
    // ✅ POPRAWKA: Nie refreshuj podczas edycji
    if (isEditing.value) {
      console.log('⏸️ Pomijam auto-refresh – użytkownik edytuje');
      return;
    }
    
    console.log('🔄 Auto-refresh danych profilu...');
    await authStore.fetchProfile();
    
    // Zaktualizuj formularz jeśli użytkownik nie edytuje żadnego pola
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
  
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});

const addApartment = () => {
  isEditing.value = true; // ✅ Zablokuj auto-refresh
  
  formData.value.apartments.push({
    number: '',
    shareAmount: '',
    additionalInfo: '',
    status: undefined,
    collectionDate: ''
  });
};

const removeApartment = (index: number) => {
  if (confirm('Czy na pewno chcesz usunąć ten lokal?')) {
    isEditing.value = true; // ✅ Zablokuj auto-refresh
    formData.value.apartments.splice(index, 1);
  }
};

// 🆕 DODANE: Sprawdzenie duplikatu przy blur/change numeru lokalu
const checkDuplicate = async (apartmentNumber: string, index: number) => {
  if (!apartmentNumber.trim()) return;
  
  try {
    const response = await axios.get(`${API_URL}/apartments/check/${encodeURIComponent(apartmentNumber)}`);
    
    if (response.data.exists) {
      console.log('⚠️ Lokal już istnieje:', response.data);
      
      // Jeśli to lokal tego samego użytkownika (edycja), ignoruj
      if (response.data.source === 'user' && response.data.owner.id === authStore.user?.id) {
        console.log('✅ To mój lokal, ignoruję duplikat');
        return;
      }
      
      // Pokaż modal
      duplicateData.value = response.data;
      showDuplicateModal.value = true;
      
      // Usuń ten lokal z formularza (użytkownik zdecyduje co dalej)
      formData.value.apartments.splice(index, 1);
    }
  } catch (err) {
    console.error('❌ Błąd sprawdzania duplikatu:', err);
  }
};

// 🆕 DODANE: Po przejęciu lokalu
const onApartmentClaimed = async () => {
  showDuplicateModal.value = false;
  
  // Odśwież profil
  await authStore.fetchProfile();
  
  formData.value.apartments = JSON.parse(JSON.stringify(authStore.user?.apartments || []));
  
  success.value = '✅ Lokal został przypisany do Twojego konta!';
  
  setTimeout(() => {
    success.value = '';
  }, 5000);
};

// 🆕 DODANE: Przejdź do edycji publicznego
const onEditPublic = (apartmentId: number) => {
  // Przekieruj do statystyk z parametrem edycji
    router.push({
    path: '/statistics',
    query: { edit: apartmentId }
  })
  console.log('Edycja publicznego lokalu:', apartmentId);
  // TODO: Implementacja zależy od tego jak chcesz to obsłużyć
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

   // 🆕 DODANE: Sprawdź duplikaty przed zapisem
  for (let i = 0; i < validApartments.length; i++) {
    const apt = validApartments[i];
    try {
      const response = await axios.get(`${API_URL}/apartments/check/${encodeURIComponent(apt.number)}`);
      
      if (response.data.exists) {
        // Jeśli to nie mój lokal
        if (!(response.data.source === 'user' && response.data.owner.id === authStore.user?.id)) {
          error.value = `Lokal ${apt.number} już istnieje. Usuń duplikaty przed zapisem.`;
          isSyncing.value = false;
          
          // Pokaż modal dla pierwszego duplikatu
          duplicateData.value = response.data;
          showDuplicateModal.value = true;
          
          return;
        }
      }
    } catch (err) {
      console.error('Błąd sprawdzania duplikatu:', err);
    }
  }
  
  try {
    // ✅ POPRAWKA: Usuń merge – zapisuj TYLKO to co jest w formularzu
    const updateData: any = {
      firstName: formData.value.firstName,
      lastName: formData.value.lastName,
      apartments: validApartments, // ✅ Tylko aktualne dane z formularza
      phoneNumber: formData.value.phoneNumber,
      email: formData.value.email,
    };
    
    if (formData.value.password) {
      updateData.password = formData.value.password;
    }
    
    console.log('💾 Zapisuję dane:', updateData);
    
    const result = await authStore.updateProfile(updateData);
    
    if (result.success) {
      success.value = '✅ Profil został zaktualizowany';
      formData.value.password = '';
      
      // ✅ Odblokuj auto-refresh
      isEditing.value = false;
      
      // Odśwież formularz najnowszymi danymi z serwera
      formData.value.apartments = JSON.parse(JSON.stringify(authStore.user?.apartments || []));
      
      setTimeout(() => {
        success.value = '';
      }, 5000);
    } else {
      error.value = result.error || 'Błąd aktualizacji profilu';
      isEditing.value = false;
    }
  } catch (err: any) {
    console.error('Update error:', err);
    error.value = 'Błąd zapisu danych. Spróbuj ponownie.';
    isEditing.value = false;
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
