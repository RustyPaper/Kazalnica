<template>
  <div class="vote-form">
    <h3>🗳️ Oddaj głos</h3>

    <form @submit.prevent="submitVote">
      <!-- Wybór opcji -->
      <div class="form-group">
        <label>Wybierz opcję: *</label>
        <div class="options-list">
          <label
            v-for="option in poll.options"
            :key="option.id"
            class="option-radio"
            :class="{ selected: formData.selectedOption === option.id }"
          >
            <input
              type="radio"
              :value="option.id"
              v-model="formData.selectedOption"
              required
            />
            <span class="option-text">{{ option.optionText }}</span>
          </label>
        </div>
      </div>

      <!-- Lokale -->
      <div class="form-group">
        <label>Lokale: *</label>
        
        <div 
          v-for="(apartment, index) in formData.apartments" 
          :key="index"
          class="apartment-item"
        >
          <div class="apartment-row">
            <div class="input-group">
              <label :for="`apt-${index}`">Numer lokalu:</label>
              <input
                :id="`apt-${index}`"
                v-model="apartment.number"
                @blur="autoFillApartment(index)"
                type="text"
                placeholder="np. D.3.21"
                required
              />
            </div>

            <div class="input-group">
              <label :for="`share-${index}`">Ilość udziałów:</label>
              <input
                :id="`share-${index}`"
                v-model="apartment.shareAmount"
                type="text"
                placeholder="np. 76"
              />
            </div>

            <button
              v-if="formData.apartments.length > 1"
              type="button"
              @click="removeApartment(index)"
              class="btn-remove-apt"
              title="Usuń lokal"
            >
              🗑️
            </button>
          </div>

          <!-- Auto-fill info -->
          <div v-if="apartment.autoFilled" class="auto-fill-info">
            ✅ Dane uzupełnione automatycznie z bazy
          </div>
        </div>

        <button 
          type="button"
          @click="addApartment"
          class="btn-add-apartment"
        >
          ➕ Dodaj kolejny lokal
        </button>
      </div>

      <!-- Dane osobowe (tylko z pierwszego lokalu) -->
      <div class="form-group">
        <label for="voterName">Imię (opcjonalnie):</label>
        <input
          id="voterName"
          v-model="formData.voterName"
          type="text"
          placeholder="Twoje imię"
        />
        <small>Będzie widoczne w wynikach jeśli podane</small>
      </div>

      <div class="form-group">
        <label for="voterPhone">Numer telefonu (opcjonalnie):</label>
        <input
          id="voterPhone"
          v-model="formData.voterPhone"
          type="tel"
          placeholder="np. 123456789"
        />
      </div>

      <!-- Podsumowanie -->
      <div class="vote-summary">
        <h4>Podsumowanie:</h4>
        <p><strong>Lokale:</strong> {{ formData.apartments.length }}</p>
        <p><strong>Suma udziałów:</strong> {{ totalShares }}</p>
      </div>

      <!-- Akcje -->
      <div class="form-actions">
        <button type="button" @click="$emit('showResults')" class="btn-secondary">
          📊 Zobacz wyniki
        </button>
        <button type="submit" class="btn-primary" :disabled="!isValid">
          ✅ Oddaj głos
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PollWithOptions } from '../types/polls';
import { votePoll, getApartmentData } from '../api/polls';

interface Props {
  poll: PollWithOptions;
}

const props = defineProps<Props>();
const emit = defineEmits(['voted', 'showResults']);

interface ApartmentInput {
  number: string;
  shareAmount: string | null;
  autoFilled?: boolean;
}

const formData = ref({
  selectedOption: '',
  apartments: [
    { number: '', shareAmount: null, autoFilled: false }
  ] as ApartmentInput[],
  voterName: '',
  voterPhone: ''
});

const totalShares = computed(() => {
  return formData.value.apartments.reduce((sum, apt) => {
    const shares = parseFloat(apt.shareAmount || '0');
    return sum + (isNaN(shares) ? 0 : shares);
  }, 0).toFixed(2);
});

const isValid = computed(() => {
  return formData.value.selectedOption !== '' &&
         formData.value.apartments.length > 0 &&
         formData.value.apartments.every(apt => apt.number.trim() !== '');
});

const addApartment = () => {
  formData.value.apartments.push({
    number: '',
    shareAmount: null,
    autoFilled: false
  });
};

const removeApartment = (index: number) => {
  formData.value.apartments.splice(index, 1);
};

const autoFillApartment = async (index: number) => {
  const apartment = formData.value.apartments[index];
  if (!apartment.number.trim()) return;

  try {
    const aptData = await getApartmentData(apartment.number);
    
    if (aptData) {
      apartment.shareAmount = aptData.shareAmount || null;
      apartment.autoFilled = true;

      // ⭐ Tylko pierwszy lokal uzupełnia dane osobowe
      if (index === 0) {
        if (aptData.ownerFirstName && !formData.value.voterName) {
          formData.value.voterName = aptData.ownerFirstName;
        }
        if (aptData.phoneNumber && !formData.value.voterPhone) {
          formData.value.voterPhone = aptData.phoneNumber;
        }
      }
    } else {
      apartment.autoFilled = false;
    }
  } catch (error) {
    console.error('Error fetching apartment data:', error);
    apartment.autoFilled = false;
  }
};

const submitVote = async () => {
  if (!isValid.value) return;

  if (!confirm(`Czy na pewno chcesz oddać głos?\n\nLokale: ${formData.value.apartments.length}\nSuma udziałów: ${totalShares.value}`)) {
    return;
  }

  try {
    const voteData = {
      optionId: formData.value.selectedOption,
      apartments: formData.value.apartments.map(apt => ({
        number: apt.number.trim(),
        shareAmount: apt.shareAmount
      })),
      voterName: formData.value.voterName.trim() || undefined,
      voterPhone: formData.value.voterPhone.trim() || undefined
    };

    await votePoll(props.poll.id, voteData);
    
    alert('✅ Głos oddany pomyślnie!');
    emit('voted');
    
  } catch (error: any) {
    console.error('Error voting:', error);
    alert(error.response?.data?.error || 'Błąd oddawania głosu');
  }
};
</script>

<style scoped>
.vote-form {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 2rem;
}

.vote-form h3 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #6c757d;
  font-size: 0.85rem;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-radio {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-radio:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.option-radio.selected {
  border-color: #007bff;
  background: #e7f3ff;
}

.option-radio input[type="radio"] {
  margin-right: 0.75rem;
  cursor: pointer;
}

.option-text {
  font-size: 1.05rem;
  color: #2c3e50;
}

.apartment-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.apartment-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1rem;
  align-items: end;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group label {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  color: #6c757d;
}

.input-group input {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
}

.input-group input:focus {
  outline: none;
  border-color: #007bff;
}

.btn-remove-apt {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  font-size: 1rem;
  transition: background 0.2s;
}

.btn-remove-apt:hover {
  background: #c82333;
}

.auto-fill-info {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #d4edda;
  color: #155724;
  border-radius: 4px;
  font-size: 0.9rem;
}

.btn-add-apartment {
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.95rem;
  width: 100%;
  transition: background 0.2s;
}

.btn-add-apartment:hover {
  background: #218838;
}

.vote-summary {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 1rem;
  margin: 1.5rem 0;
}

.vote-summary h4 {
  margin: 0 0 0.5rem 0;
  color: #856404;
}

.vote-summary p {
  margin: 0.25rem 0;
  color: #856404;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-primary, .btn-secondary {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

@media (max-width: 768px) {
  .apartment-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .btn-remove-apt {
    width: 100%;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>

