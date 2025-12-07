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
            Numer Apartamentu <span class="required">*</span>
          </label>
          <input type="text" v-model="formData.apartmentNumber" required />
        </div>
        
        <div class="form-group">
          <label>Opis wydarzenia</label>
          <textarea v-model="formData.description" rows="4"></textarea>
        </div>
        
        <div class="error" v-if="error">{{ error }}</div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="submit" class="btn btn-primary">
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
import { ref, onMounted } from 'vue';
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

const formData = ref({
  date: '',
  apartmentNumber: '',
  description: '',
});

const error = ref('');

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
  
  emit('save', {
    ...formData.value,
    id: props.editingEvent?.id,
  });
};
</script>
