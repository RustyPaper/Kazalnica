<template>
  <div class="container">
    <div class="card profile-card">
      <div class="profile-header">
        <h2>👤 Profil użytkownika</h2>
        <p>Zarządzaj swoimi danymi</p>
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
          <button type="submit" class="btn btn-primary btn-block">
            💾 Zapisz zmiany
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
  
  const validApartments = formData.value.apartments.filter(apt => apt.number.trim() !== '');
  
  if (validApartments.length === 0) {
    error.value = 'Musisz podać przynajmniej jeden numer lokalu';
    return;
  }
  
  const updateData: any = {
    firstName: formData.value.firstName,
    lastName: formData.value.lastName,
    apartments: validApartments,
    phoneNumber: formData.value.phoneNumber,
    email: formData.value.email,
  };
  
  if (formData.value.password) {
    updateData.password = formData.value.password;
  }
  
  const result = await authStore.updateProfile(updateData);
  
  if (result.success) {
    success.value = 'Profil został zaktualizowany';
    formData.value.password = '';
    
    // Auto-hide success message
    setTimeout(() => {
      success.value = '';
    }, 3000);
  } else {
    error.value = result.error || 'Błąd aktualizacji profilu';
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
}

.profile-header h2 {
  margin-bottom: 10px;
  font-size: 28px;
}

.profile-header p {
  color: #666;
  font-size: 14px;
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

/* Mobile responsive */
@media (max-width: 768px) {
  .profile-card {
    margin: 15px auto;
  }

  .profile-header h2 {
    font-size: 24px;
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

