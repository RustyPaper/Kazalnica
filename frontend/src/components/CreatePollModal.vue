<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>➕ Nowa ankieta</h2>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>

      <form @submit.prevent="submitPoll" class="poll-form">
        <!-- Tytuł -->
        <div class="form-group">
          <label for="title">Tytuł / Pytanie *</label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            required
            placeholder="np. Czy zgadzasz się na remont dachu?"
            maxlength="500"
          />
        </div>

        <!-- Opis -->
        <div class="form-group">
          <label for="description">Opis (opcjonalnie)</label>
          <textarea
            id="description"
            v-model="formData.description"
            rows="3"
            placeholder="Dodatkowe informacje..."
          ></textarea>
        </div>

        <!-- Opcje -->
        <div class="form-group">
          <label>Opcje do wyboru *</label>
          <div class="options-list">
            <div 
              v-for="(option, index) in formData.options" 
              :key="index"
              class="option-item"
            >
              <input
                v-model="formData.options[index]"
                type="text"
                :placeholder="`Opcja ${index + 1}`"
                required
                maxlength="500"
              />
              <button 
                v-if="formData.options.length > 2"
                type="button"
                @click="removeOption(index)"
                class="btn-remove"
                title="Usuń opcję"
              >
                🗑️
              </button>
            </div>
          </div>
          <button 
            type="button"
            @click="addOption"
            class="btn-add-option"
          >
            ➕ Dodaj opcję
          </button>
        </div>

        <!-- Data zamknięcia -->
        <div class="form-group">
          <label for="closesAt">
            <input
              type="checkbox"
              v-model="hasCloseDate"
              id="hasCloseDate"
            />
            Ustaw automatyczne zamknięcie
          </label>
          
          <input
            v-if="hasCloseDate"
            v-model="formData.closesAt"
            type="datetime-local"
            id="closesAt"
            class="datetime-input"
            :min="minDateTime"
          />
        </div>

        <!-- Dodatkowe opcje -->
        <div class="form-group">
          <label>
            <input
              type="checkbox"
              v-model="formData.allowMultipleVotes"
            />
            Pozwól na wielokrotne głosowanie (w przyszłości)
          </label>
        </div>

        <!-- Akcje -->
        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn-cancel">
            Anuluj
          </button>
          <button type="submit" class="btn-submit" :disabled="!isValid">
            Utwórz ankietę
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { createPoll } from '../api/polls';

const emit = defineEmits(['close', 'created']);

const formData = ref({
  title: '',
  description: '',
  options: ['', ''],
  closesAt: '',
  allowMultipleVotes: false
});

const hasCloseDate = ref(false);

const minDateTime = computed(() => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5); // minimum 5 minut od teraz
  return now.toISOString().slice(0, 16);
});

const isValid = computed(() => {
  return formData.value.title.trim() !== '' &&
         formData.value.options.length >= 2 &&
         formData.value.options.every(opt => opt.trim() !== '');
});

const addOption = () => {
  formData.value.options.push('');
};

const removeOption = (index: number) => {
  formData.value.options.splice(index, 1);
};

const submitPoll = async () => {
  if (!isValid.value) return;

  try {
    const data = {
      title: formData.value.title.trim(),
      description: formData.value.description.trim() || undefined,
      options: formData.value.options.map(opt => opt.trim()),
      closesAt: hasCloseDate.value && formData.value.closesAt 
        ? new Date(formData.value.closesAt).toISOString() 
        : undefined,
      allowMultipleVotes: formData.value.allowMultipleVotes
    };

    await createPoll(data);
    emit('created');
  } catch (error: any) {
    console.error('Error creating poll:', error);
    alert(error.response?.data?.error || 'Błąd tworzenia ankiety');
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f8f9fa;
}

.poll-form {
  padding: 1.5rem;
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

.form-group input[type="text"],
.form-group textarea,
.datetime-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.option-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.option-item input {
  flex: 1;
}

.btn-remove {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-remove:hover {
  background: #c82333;
}

.btn-add-option {
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-add-option:hover {
  background: #218838;
}

.datetime-input {
  margin-top: 0.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.btn-cancel, .btn-submit {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background: #5a6268;
}

.btn-submit {
  background: #007bff;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #0056b3;
}

.btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
