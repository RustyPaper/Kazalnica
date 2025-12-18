<template>
  <div class="container">
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>Kalendarz</h2>
        <!-- ZMIENIONO: Przycisk dla wszystkich (nie tylko zalogowanych) -->
        <button
          class="btn btn-primary"
          @click="openAddEventModal"
        >
          + Dodaj wydarzenie
        </button>
      </div>
      
      <div v-if="loading" style="text-align: center; padding: 40px;">
        Ładowanie...
      </div>
      
      <div v-else>
        <CalendarGrid
          :current-month="currentMonth"
          :current-year="currentYear"
          :events="events"
          :holidays="holidays"
          @update:month="currentMonth = $event"
          @update:year="currentYear = $event; fetchHolidays()"
          @day-click="handleDayClick"
          @event-click="handleEventClick"
        />
      </div>
      
      <div v-if="error" class="error" style="margin-top: 20px;">{{ error }}</div>
      <div v-if="success" class="success" style="margin-top: 20px;">{{ success }}</div>
    </div>
    
    <!-- Add/Edit Event Modal -->
    <EventModal
      v-if="showEventModal"
      :selected-date="selectedDate"
      :editing-event="editingEvent"
      @close="closeEventModal"
      @save="handleSaveEvent"
    />
    
    <!-- Event Details Modal -->
    <div v-if="showEventDetails && selectedEventDetails" class="modal-overlay" @click.self="closeEventDetails">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Szczegóły wydarzenia</h3>
          <button class="modal-close" @click="closeEventDetails">&times;</button>
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Data:</strong> {{ formatDate(selectedEventDetails.date) }}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Numer Apartamentu:</strong> {{ selectedEventDetails.apartmentNumber }}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Opis:</strong> {{ selectedEventDetails.description || 'Brak opisu' }}
        </div>
        
        <!-- DODANO: Informacja o anonimowym twórcy -->
        <div style="margin-bottom: 15px;">
          <strong>Utworzone przez:</strong> 
          <span v-if="selectedEventDetails.createdBy === 'anonymous'" class="badge-anonymous">
            Anonim
          </span>
          <span v-else>
            Użytkownik
          </span>
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Utworzono:</strong> {{ formatDateTime(selectedEventDetails.createdAt) }}
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button
            v-if="canEditEvent(selectedEventDetails)"
            class="btn btn-primary"
            @click="editEvent(selectedEventDetails)"
          >
            Edytuj
          </button>
          <button
            v-if="canDeleteEvent(selectedEventDetails)"
            class="btn btn-danger"
            @click="deleteEventConfirm"
          >
            Usuń
          </button>
          <button class="btn btn-secondary" @click="closeEventDetails">
            Zamknij
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import CalendarGrid from '../components/CalendarGrid.vue';
import EventModal from '../components/EventModal.vue';
import { formatDate, formatDateTime } from '../utils/dateHelpers';
import type { Event, Holiday } from '../types';
import { API_URL } from '../config';

const authStore = useAuthStore();

const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());
const events = ref<Event[]>([]);
const holidays = ref<Holiday[]>([]);
const loading = ref(true);
const error = ref('');
const success = ref('');

const showEventModal = ref(false);
const showEventDetails = ref(false);
const selectedDate = ref('');
const editingEvent = ref<Event | null>(null);
const selectedEventDetails = ref<Event | null>(null);

const fetchEvents = async () => {
  try {
    // ZMIENIONO: Nie wysyłaj tokenu dla GET (endpoint publiczny)
    const response = await axios.get(`${API_URL}/events`);
    events.value = response.data;
    error.value = '';
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Błąd pobierania wydarzeń';
  }
};

const fetchHolidays = async () => {
  try {
    // ZMIENIONO: Nie wysyłaj tokenu dla GET (endpoint publiczny)
    const response = await axios.get(`${API_URL}/events/holidays/${currentYear.value}`);
    holidays.value = response.data;
    error.value = '';
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Błąd pobierania świąt';
  }
};

const openAddEventModal = () => {
  selectedDate.value = '';
  editingEvent.value = null;
  showEventModal.value = true;
};

const closeEventModal = () => {
  showEventModal.value = false;
  selectedDate.value = '';
  editingEvent.value = null;
};

// ZMIENIONO: Każdy może kliknąć dzień (nie tylko z uprawnieniami)
const handleDayClick = (date: string) => {
  selectedDate.value = date;
  editingEvent.value = null;
  showEventModal.value = true;
};

const handleEventClick = (event: Event) => {
  selectedEventDetails.value = event;
  showEventDetails.value = true;
};

const closeEventDetails = () => {
  showEventDetails.value = false;
  selectedEventDetails.value = null;
};

// Sprawdź czy użytkownik może edytować wydarzenie
const canEditEvent = (event: Event): boolean => {
  // Niezalogowany nie może edytować
  if (!authStore.isAuthenticated) {
    return false;
  }
  
  // Admin może edytować wszystko
  if (authStore.isAdmin) {
    return true;
  }
  
  // User może edytować tylko swoje (nie anonimowe)
  return event.createdBy === authStore.user?.id;
};

// NOWA funkcja: Sprawdź czy użytkownik może usunąć wydarzenie
const canDeleteEvent = (event: Event): boolean => {
  // Niezalogowany nie może usuwać
  if (!authStore.isAuthenticated) {
    return false;
  }
  
  // Sprawdź uprawnienie deleteEvent
  if (!authStore.hasPermission('deleteEvent') && !authStore.isAdmin) {
    return false;
  }
  
  // Admin może usuwać wszystko
  if (authStore.isAdmin) {
    return true;
  }
  
  // User może usuwać tylko swoje (nie anonimowe)
  return event.createdBy === authStore.user?.id;
};

const editEvent = (event: Event) => {
  editingEvent.value = event;
  showEventDetails.value = false;
  showEventModal.value = true;
};

const handleSaveEvent = async (eventData: Partial<Event>) => {
  try {
    error.value = '';
    success.value = '';
    
    if (eventData.id) {
      // Edycja (wymaga logowania)
      await axios.put(`${API_URL}/events/${eventData.id}`, eventData);
      success.value = 'Wydarzenie zaktualizowane';
    } else {
      // Dodawanie (dostępne dla wszystkich)
      // Token zostanie automatycznie dodany przez axios interceptor jeśli użytkownik zalogowany
      await axios.post(`${API_URL}/events`, eventData);
      success.value = authStore.isAuthenticated 
        ? 'Wydarzenie dodane' 
        : 'Wydarzenie dodane (jako anonim)';
    }
    
    await fetchEvents();
    closeEventModal();
    
    setTimeout(() => {
      success.value = '';
    }, 3000);
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Błąd zapisywania wydarzenia';
  }
};

const deleteEventConfirm = async () => {
  if (!confirm('Czy na pewno chcesz usunąć to wydarzenie?')) {
    return;
  }
  
  if (!selectedEventDetails.value) return;
  
  try {
    await axios.delete(`${API_URL}/events/${selectedEventDetails.value.id}`);
    success.value = 'Wydarzenie usunięte';
    await fetchEvents();
    closeEventDetails();
    
    setTimeout(() => {
      success.value = '';
    }, 3000);
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Błąd usuwania wydarzenia';
  }
};

onMounted(async () => {
  loading.value = true;
  await Promise.all([fetchEvents(), fetchHolidays()]);
  loading.value = false;
});

watch(currentYear, () => {
  fetchHolidays();
});
</script>

<style scoped>
/* Istniejące style... */

/* DODANO: Styl dla badge anonimowy */
.badge-anonymous {
  background: #f0f0f0;
  color: #666;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.error {
  color: #dc3545;
  background: #f8d7da;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
}

.success {
  color: #155724;
  background: #d4edda;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
}
</style>
