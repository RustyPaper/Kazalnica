<template>
  <div>
    <div class="calendar-header">
      <button class="btn btn-secondary" @click="previousMonth">
        &larr; Poprzedni
      </button>
      <h2>{{ monthName }} {{ currentYear }}</h2>
      <button class="btn btn-secondary" @click="nextMonth">
        Następny &rarr;
      </button>
    </div>
    
    <div class="calendar-grid">
      <div v-for="day in weekDays" :key="day" class="calendar-day-header">
        {{ day }}
      </div>
      
      <div
        v-for="day in calendarDays"
        :key="day.date"
        class="calendar-day"
        :class="{
          'other-month': !day.isCurrentMonth,
          'holiday': day.isHoliday,
          'today': day.isToday
        }"
        @click="handleDayClick(day)"
      >
        <div class="calendar-day-number">{{ day.dayNumber }}</div>
        
        <div v-if="day.holidayName" class="holiday-name">
          {{ day.holidayName }}
        </div>
        
        <div class="calendar-events">
          <div
            v-for="event in day.events"
            :key="event.id"
            class="calendar-event"
            @click.stop="handleEventClick(event)"
            :title="`Apartament ${event.apartmentNumber}: ${event.description || 'Brak opisu'}`"
          >
            {{ event.apartmentNumber }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Event, Holiday } from '../types';

interface Props {
  currentMonth: number;
  currentYear: number;
  events: Event[];
  holidays: Holiday[];
}

interface CalendarDay {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isHoliday: boolean;
  holidayName?: string;
  events: Event[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:month': [month: number];
  'update:year': [year: number];
  'day-click': [date: string];
  'event-click': [event: Event];
}>();

const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'];

const monthNames = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

const monthName = computed(() => monthNames[props.currentMonth]);

const calendarDays = computed(() => {
  const days: CalendarDay[] = [];
  const firstDay = new Date(props.currentYear, props.currentMonth, 1);
  const lastDay = new Date(props.currentYear, props.currentMonth + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get the day of week (0 = Sunday, 1 = Monday, etc.)
  // Adjust so Monday = 0
  let startDay = firstDay.getDay() - 1;
  if (startDay === -1) startDay = 6;
  
  // Add days from previous month
  const prevMonthLastDay = new Date(props.currentYear, props.currentMonth, 0);
  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(props.currentYear, props.currentMonth - 1, prevMonthLastDay.getDate() - i);
    days.push(createCalendarDay(date, false));
  }
  
  // Add days from current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(props.currentYear, props.currentMonth, i);
    days.push(createCalendarDay(date, true));
  }
  
  // Add days from next month to complete the grid
  const remainingDays = 42 - days.length; // 6 weeks * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(props.currentYear, props.currentMonth + 1, i);
    days.push(createCalendarDay(date, false));
  }
  
  return days;
});

const createCalendarDay = (date: Date, isCurrentMonth: boolean): CalendarDay => {
  const dateString = date.toISOString().split('T')[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const holiday = props.holidays.find(h => h.date === dateString);
  const dayEvents = props.events.filter(e => e.date === dateString);
  
  return {
    date: dateString,
    dayNumber: date.getDate(),
    isCurrentMonth,
    isToday: date.getTime() === today.getTime(),
    isHoliday: !!holiday,
    holidayName: holiday?.name,
    events: dayEvents,
  };
};

const previousMonth = () => {
  if (props.currentMonth === 0) {
    emit('update:month', 11);
    emit('update:year', props.currentYear - 1);
  } else {
    emit('update:month', props.currentMonth - 1);
  }
};

const nextMonth = () => {
  if (props.currentMonth === 11) {
    emit('update:month', 0);
    emit('update:year', props.currentYear + 1);
  } else {
    emit('update:month', props.currentMonth + 1);
  }
};

const handleDayClick = (day: CalendarDay) => {
  if (day.isCurrentMonth) {
    emit('day-click', day.date);
  }
};

const handleEventClick = (event: Event) => {
  emit('event-click', event);
};
</script>
