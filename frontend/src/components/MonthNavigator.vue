<template>
  <div class="month-navigator">
    <button class="btn btn-secondary" @click="goToToday">
      Dzisiaj
    </button>
    
    <div class="month-selector">
      <button class="nav-btn" @click="previousYear">
        &laquo;
      </button>
      <button class="nav-btn" @click="previousMonth">
        &lsaquo;
      </button>
      
      <div class="current-month">
        <select v-model.number="selectedMonth" @change="onMonthChange" class="month-select">
          <option v-for="(month, index) in months" :key="index" :value="index">
            {{ month }}
          </option>
        </select>
        <select v-model.number="selectedYear" @change="onYearChange" class="year-select">
          <option v-for="year in yearRange" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>
      
      <button class="nav-btn" @click="nextMonth">
        &rsaquo;
      </button>
      <button class="nav-btn" @click="nextYear">
        &raquo;
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  currentMonth: number;
  currentYear: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:month': [month: number];
  'update:year': [year: number];
}>();

const selectedMonth = ref(props.currentMonth);
const selectedYear = ref(props.currentYear);

const months = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

const yearRange = computed(() => {
  const currentYear = new Date().getFullYear();
  const start = currentYear - 5;
  const end = currentYear + 10;
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

watch(() => props.currentMonth, (newMonth) => {
  selectedMonth.value = newMonth;
});

watch(() => props.currentYear, (newYear) => {
  selectedYear.value = newYear;
});

const previousMonth = () => {
  if (selectedMonth.value === 0) {
    selectedMonth.value = 11;
    selectedYear.value--;
    emit('update:year', selectedYear.value);
  } else {
    selectedMonth.value--;
  }
  emit('update:month', selectedMonth.value);
};

const nextMonth = () => {
  if (selectedMonth.value === 11) {
    selectedMonth.value = 0;
    selectedYear.value++;
    emit('update:year', selectedYear.value);
  } else {
    selectedMonth.value++;
  }
  emit('update:month', selectedMonth.value);
};

const previousYear = () => {
  selectedYear.value--;
  emit('update:year', selectedYear.value);
};

const nextYear = () => {
  selectedYear.value++;
  emit('update:year', selectedYear.value);
};

const goToToday = () => {
  const today = new Date();
  selectedMonth.value = today.getMonth();
  selectedYear.value = today.getFullYear();
  emit('update:month', selectedMonth.value);
  emit('update:year', selectedYear.value);
};

const onMonthChange = () => {
  emit('update:month', selectedMonth.value);
};

const onYearChange = () => {
  emit('update:year', selectedYear.value);
};
</script>

<style scoped>
.month-navigator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 15px;
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-btn {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.2s;
}

.nav-btn:hover {
  background-color: #e9ecef;
}

.current-month {
  display: flex;
  gap: 10px;
}

.month-select,
.year-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.month-select {
  min-width: 120px;
}

.year-select {
  min-width: 80px;
}
</style>
