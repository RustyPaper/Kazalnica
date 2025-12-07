<template>
  <div
    class="calendar-day"
    :class="{
      'other-month': !isCurrentMonth,
      'holiday': isHoliday,
      'today': isToday
    }"
    @click="$emit('click')"
  >
    <div class="calendar-day-number">{{ dayNumber }}</div>
    
    <div v-if="holidayName" class="holiday-name">
      {{ holidayName }}
    </div>
    
    <div class="calendar-events">
      <div
        v-for="event in visibleEvents"
        :key="event.id"
        class="calendar-event"
        @click.stop="$emit('event-click', event)"
        :title="`Apartament ${event.apartmentNumber}: ${event.description || 'Brak opisu'}`"
      >
        {{ event.apartmentNumber }}
      </div>
      <div v-if="remainingCount > 0" class="calendar-event-more">
        +{{ remainingCount }} więcej
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Event } from '../types';

interface Props {
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isHoliday: boolean;
  holidayName?: string;
  events: Event[];
  maxVisibleEvents?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxVisibleEvents: 3,
});

defineEmits<{
  click: [];
  'event-click': [event: Event];
}>();

const visibleEvents = computed(() => {
  return props.events.slice(0, props.maxVisibleEvents);
});

const remainingCount = computed(() => {
  return Math.max(0, props.events.length - props.maxVisibleEvents);
});
</script>
