<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">{{ editingEvent ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie' }}</h3>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>
            Data <span class="required">*</span>
          </label>
          <input type="date" v-model="formData.date" required />
        </div>
        
        <div class="form-group">
          <label>
            Numer lokalu <span class="required">*</span>
          </label>
          
          <!-- ZMIENIONO: Dla niezalogowanych - pole tekstowe -->
          <input 
            v-if="!authStore.isAuthenticated"
            type="text" 
            v-model="formData.apartmentNumber"
            placeholder="Wpisz numer lokalu (np. D.3.21, 1413)"
            required 
          />
          
          <!-- Dla zalogowanych BEZ apartamentów - pole tekstowe -->
          <input 
            v-else-if="userApartments.length === 0"
            type="text" 
            v-model="formData.apartmentNumber"
            placeholder="Wpisz numer lokalu"
            required 
          />
          
          <!-- Dla zalogowanych Z apartamentami - select -->
          <select 
            v-else
            v-model="formData.apartmentNumber" 
            required
          >
            <option value="" disabled>Wybierz apartament</option>
            <option 
              v-for="apartment in userApartments" 
              :key="apartment.number" 
              :value="apartment.number"
            >
              {{ apartment.number }}
              <template v-if="apartment.additionalInfo">
                - {{ apartment.additionalInfo }}
              </template>
            </option>
          </select>
          
          <!-- Informacje pomocnicze -->
          <small v-if="!authStore.isAuthenticated" class="text-muted">
            💡 Dodajesz wydarzenie bez logowania. Możesz podać dowolny numer lokalu.
          </small>
          <small v-else-if="userApartments.length === 0" class="text-muted">
            Brak apartamentów przypisanych do Twojego konta. Dodaj apartamenty w profilu lub wpisz numer ręcznie.
          </small>
        </div>
        
        <div class="form-group">
          <label>Opis wydarzenia</label>
          <textarea 
            v-model="formData.description" 
            rows="4"
            placeholder="Opcjonalny opis wydarzenia..."
          ></textarea>
        </div>
        
        <div class="error" v-if="error">{{ error }}</div>
        
        <!-- DODANO: Informacja dla niezalogowanych -->
        <div v-if="!authStore.isAuthenticated" class="info-box">
          ℹ️ Dodajesz wydarzenie jako gość. <router-link to="/login">Zaloguj się</router-link>, aby zarządzać swoimi wydarzeniami.
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button 
            type="submit" 
            class="btn btn-primary"
          >
            {{ editingEvent ? 'Zapisz' : 'Dodaj' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            Anuluj
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import type { Event } from '../types';

interface Props {
  selectedDate?: string;
  editingEvent?: Event | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  save: [event: Partial<Event>];
}>();

const authStore = useAuthStore();

const formData = ref({
  date: '',
  apartmentNumber: '',
  description: '',
});

const error = ref('');

// Pobierz apartamenty zalogowanego użytkownika
const userApartments = computed(() => {
  if (!authStore.user || !authStore.user.apartments) {
    return [];
  }
  return authStore.user.apartments;
});

onMounted(() => {
  if (props.editingEvent) {
    formData.value = {
      date: props.editingEvent.date,
      apartmentNumber: props.editingEvent.apartmentNumber,
      description: props.editingEvent.description || '',
    };
  } else if (props.selectedDate) {
    formData.value.date = props.selectedDate;
  }
});

const handleSubmit = () => {
  error.value = '';
  
  if (!formData.value.date || !formData.value.apartmentNumber) {
    error.value = 'Wypełnij wszystkie wymagane pola';
    return;
  }
  
  // Walidacja numeru lokalu
  if (formData.value.apartmentNumber.trim().length === 0) {
    error.value = 'Numer lokalu nie może być pusty';
    return;
  }
  
  emit('save', {
    ...formData.value,
    id: props.editingEvent?.id,
  });
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-title {
  margin: 0;
  font-size: 20px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
}

.modal-close:hover {
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.required {
  color: #dc3545;
}

input[type="date"],
input[type="text"],
select,
textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

select {
  cursor: pointer;
}

textarea {
  resize: vertical;
  font-family: inherit;
}

.text-muted {
  color: #6c757d;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.info-box {
  background: #e7f3ff;
  border: 1px solid #b3d9ff;
  color: #004085;
  padding: 10px;
  border-radius: 6px;
  font-size: 13px;
  margin-top: 15px;
}

.info-box a {
  color: #0056b3;
  font-weight: 600;
  text-decoration: underline;
}

.error {
  color: #dc3545;
  background: #f8d7da;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 14px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .modal {
    padding: 20px;
  }
  
  .modal-title {
    font-size: 18px;
  }
}
</style>
