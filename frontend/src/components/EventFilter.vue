<template>
  <div class="event-filter">
    <div class="filter-header">
      <h3>Filtruj wydarzenia</h3>
      <button class="btn btn-secondary" @click="resetFilters" style="padding: 5px 10px; font-size: 12px;">
        Resetuj
      </button>
    </div>
    
    <div class="form-group">
      <label>Szukaj</label>
      <input
        type="text"
        v-model="localFilters.search"
        placeholder="Numer apartamentu lub opis..."
        @input="emitFilters"
      />
    </div>
    
    <div class="form-group">
      <label>Data od</label>
      <input
        type="date"
        v-model="localFilters.dateFrom"
        @change="emitFilters"
      />
    </div>
    
    <div class="form-group">
      <label>Data do</label>
      <input
        type="date"
        v-model="localFilters.dateTo"
        @change="emitFilters"
      />
    </div>
    
    <div class="form-group">
      <label>Numer apartamentu</label>
      <select v-model="localFilters.apartmentNumber" @change="emitFilters">
        <option value="">Wszystkie</option>
        <option v-for="apt in apartmentNumbers" :key="apt" :value="apt">
          {{ apt }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Event } from '../types';

interface Filters {
  search: string;
  dateFrom: string;
  dateTo: string;
  apartmentNumber: string;
}

interface Props {
  events: Event[];
  filters: Filters;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:filters': [filters: Filters];
}>();

const localFilters = ref<Filters>({ ...props.filters });

const apartmentNumbers = computed(() => {
  const numbers = new Set(props.events.map(e => e.apartmentNumber));
  return Array.from(numbers).sort();
});

watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters };
}, { deep: true });

const emitFilters = () => {
  emit('update:filters', { ...localFilters.value });
};

const resetFilters = () => {
  localFilters.value = {
    search: '',
    dateFrom: '',
    dateTo: '',
    apartmentNumber: '',
  };
  emitFilters();
};
</script>

<style scoped>
.event-filter {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.filter-header h3 {
  margin: 0;
  font-size: 16px;
}
</style>
