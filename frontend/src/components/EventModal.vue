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
            Apartament <span class="required">*</span>
          </label>
          <select v-model="formData.apartmentNumber" required>
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
          <small v-if="userApartments.length === 0" class="text-muted">
            Brak dostępnych apartamentów. Dodaj apartamenty w swoim profilu.
          </small>
        </div>
        
        <div class="form-group">
          <label>Opis wydarzenia</label>
          <textarea v-model="formData.description" rows="4"></textarea>
        </div>
        
        <div class="error" v-if="error">{{ error }}</div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="userApartments.length === 0"
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
  return authStore.user?.apartments || [];
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
  
  if (userApartments.value.length === 0) {
    error.value = 'Brak dostępnych apartamentów';
    return;
  }
  
  emit('save', {
    ...formData.value,
    id: props.editingEvent?.id,
  });
};
</script>

<style scoped>
select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
}

select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
}

select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.text-muted {
  color: #6c757d;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
