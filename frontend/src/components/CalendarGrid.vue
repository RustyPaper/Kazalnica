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
          'high-season': day.isHighSeason,
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
import { isHighSeasonComplete } from '../utils/dateHelpers';

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
  isHighSeason: boolean;
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
  // FIX: Użyj lokalnej daty zamiast UTC - unikaj toISOString()
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  
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
    isHighSeason: isHighSeasonComplete(dateString),
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

<style scoped>
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.calendar-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e0e0e0;
  border: 1px solid #e0e0e0;
}

.calendar-day-header {
  background-color: #f5f5f5;
  padding: 10px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  color: #666;
}

.calendar-day {
  background-color: white;
  min-height: 100px;
  padding: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.calendar-day:hover {
  background-color: #f8f9fa;
}

.calendar-day.other-month {
  background-color: #fafafa;
  opacity: 0.6;
}

.calendar-day.other-month:hover {
  background-color: #f0f0f0;
}

.calendar-day.holiday {
  background-color: #fff9e6;
}

.calendar-day.holiday:hover {
  background-color: #fff3d9;
}

.calendar-day.high-season {
  background-color: #ffe6e6;
}

.calendar-day.high-season:hover {
  background-color: #ffd9d9;
}

/* Jeśli dzień jest zarówno świętem jak i sezonem wysokim */
.calendar-day.holiday.high-season {
  background: linear-gradient(135deg, #fff9e6 50%, #ffe6e6 50%);
}

.calendar-day.holiday.high-season:hover {
  background: linear-gradient(135deg, #fff3d9 50%, #ffd9d9 50%);
}

.calendar-day.today {
  border: 2px solid #007bff;
}

.calendar-day-number {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
  color: #333;
}

.calendar-day.other-month .calendar-day-number {
  color: #999;
}

.holiday-name {
  font-size: 11px;
  color: #d97706;
  font-weight: 500;
  margin-bottom: 4px;
  line-height: 1.2;
}

.calendar-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.calendar-event {
  background-color: #007bff;
  color: white;
  padding: 4px 6px;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.calendar-event:hover {
  background-color: #0056b3;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

@media (max-width: 768px) {
  .calendar-day {
    min-height: 80px;
    padding: 4px;
  }

  .calendar-day-number {
    font-size: 14px;
  }

  .holiday-name {
    font-size: 9px;
  }

  .calendar-event {
    font-size: 10px;
    padding: 2px 4px;
  }
}
</style>
