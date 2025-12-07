<template>
  <div class="event-list">
    <h3>Najbliższe wydarzenia</h3>
    
    <div v-if="upcomingEvents.length === 0" style="text-align: center; padding: 20px; color: #666;">
      Brak nadchodzących wydarzeń
    </div>
    
    <div v-else class="events-container">
      <div
        v-for="event in upcomingEvents"
        :key="event.id"
        class="event-item"
        @click="$emit('event-click', event)"
      >
        <div class="event-date">
          <div class="event-day">{{ getDay(event.date) }}</div>
          <div class="event-month">{{ getMonth(event.date) }}</div>
        </div>
        <div class="event-details">
          <div class="event-title">Apartament {{ event.apartmentNumber }}</div>
          <div class="event-description">{{ event.description || 'Brak opisu' }}</div>
        </div>
        <div class="event-arrow">›</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Event } from '../types';

interface Props {
  events: Event[];
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  limit: 5,
});

defineEmits<{
  'event-click': [event: Event];
}>();

const upcomingEvents = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return props.events
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, props.limit);
});

const getDay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.getDate().toString();
};

const getMonth = (dateString: string): string => {
  const date = new Date(dateString);
  const months = ['STY', 'LUT', 'MAR', 'KWI', 'MAJ', 'CZE', 'LIP', 'SIE', 'WRZ', 'PAŹ', 'LIS', 'GRU'];
  return months[date.getMonth()];
};
</script>

<style scoped>
.event-list h3 {
  margin-bottom: 15px;
}

.events-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.event-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.event-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border-radius: 8px;
}

.event-day {
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
}

.event-month {
  font-size: 12px;
  margin-top: 2px;
}

.event-details {
  flex: 1;
}

.event-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.event-description {
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-arrow {
  font-size: 24px;
  color: #999;
}
</style>
