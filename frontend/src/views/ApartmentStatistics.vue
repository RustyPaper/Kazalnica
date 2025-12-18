<template>
  <div class="container">
    <div class="card">
      <h2 style="margin-bottom: 20px;">Statystyki lokali i udziałów</h2>
      
      <!-- Settings Section (Admin Only) -->
      <div v-if="authStore.isAdmin" class="card" style="background-color: #f8f9fa; margin-bottom: 20px;">
        <h3 style="margin-bottom: 15px;">Ustawienia</h3>
        <div style="display: flex; gap: 15px; align-items: end;">
          <div class="form-group" style="flex: 1; margin-bottom: 0;">
            <label>Docelowa suma udziałów</label>
            <input 
              type="number" 
              v-model.number="targetShares" 
              min="1"
              step="0.01"
              placeholder="10000"
            />
          </div>
          <button class="btn btn-primary" @click="updateSettings">
            Zapisz ustawienia
          </button>
        </div>
      </div>
      
      <div v-if="loading" style="text-align: center; padding: 40px;">
        Ładowanie statystyk...
      </div>
      
      <div v-else-if="statistics">
        <!-- Summary Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.totalApartments }}</div>
              <div class="stat-label">Wszystkie lokale</div>
            </div>
          </div>
          
          <div class="stat-card stat-card-shares">
            <div class="stat-icon">🏢</div>
            <div class="stat-content">
              <div class="stat-value">{{ formatNumber(statistics.totalShares) }}</div>
              <div class="stat-label">Suma udziałów</div>
            </div>
          </div>
          
          <div class="stat-card stat-card-target">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <div class="stat-value">{{ formatNumber(statistics.totalSharesTarget) }}</div>
              <div class="stat-label">Cel udziałów</div>
            </div>
          </div>
          
          <div class="stat-card stat-card-percentage">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.sharePercentage.toFixed(2) }}%</div>
              <div class="stat-label">Procent realizacji</div>
            </div>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="card" style="margin-top: 20px;">
          <h3 style="margin-bottom: 15px;">Postęp realizacji udziałów</h3>
          <div class="progress-container">
            <div 
              class="progress-bar" 
              :style="{ width: Math.min(statistics.sharePercentage, 100) + '%' }"
            >
              <span class="progress-text">{{ statistics.sharePercentage.toFixed(2) }}%</span>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 14px; color: #666;">
            <span>{{ formatNumber(statistics.totalShares) }} / {{ formatNumber(statistics.totalSharesTarget) }}</span>
            <span>Pozostało: {{ formatNumber(statistics.totalSharesTarget - statistics.totalShares) }}</span>
          </div>
        </div>
        
        <!-- Status Distribution -->
        <div class="card" style="margin-top: 20px;">
          <h3 style="margin-bottom: 15px;">Rozkład według statusu</h3>
          <div class="status-grid">
            <div class="status-card" @click="filterByStatus('lease_agreement')" style="cursor: pointer;">
              <div class="status-icon">📄</div>
              <div class="status-count">{{ statistics.statusCounts.lease_agreement }}</div>
              <div class="status-label">Umowa dzierżawy</div>
              <div class="status-percentage">{{ getStatusPercentage('lease_agreement') }}%</div>
              <div class="status-shares">{{ formatNumber(getStatusShares('lease_agreement')) }} udziałów</div>
            </div>
            
            <div class="status-card" @click="filterByStatus('notice_sent')" style="cursor: pointer;">
              <div class="status-icon">📧</div>
              <div class="status-count">{{ statistics.statusCounts.notice_sent }}</div>
              <div class="status-label">Wysłane wezwanie</div>
              <div class="status-percentage">{{ getStatusPercentage('notice_sent') }}%</div>
              <div class="status-shares">{{ formatNumber(getStatusShares('notice_sent')) }} udziałów</div>
            </div>
            
            <div class="status-card" @click="filterByStatus('collection_date')" style="cursor: pointer;">
              <div class="status-icon">📅</div>
              <div class="status-count">{{ statistics.statusCounts.collection_date }}</div>
              <div class="status-label">Planowany odbiór</div>
              <div class="status-percentage">{{ getStatusPercentage('collection_date') }}%</div>
              <div class="status-shares">{{ formatNumber(getStatusShares('collection_date')) }} udziałów</div>
            </div>
            
            <div class="status-card" @click="filterByStatus('collected')" style="cursor: pointer;">
              <div class="status-icon">✅</div>
              <div class="status-count">{{ statistics.statusCounts.collected }}</div>
              <div class="status-label">Odebrane</div>
              <div class="status-percentage">{{ getStatusPercentage('collected') }}%</div>
              <div class="status-shares">{{ formatNumber(getStatusShares('collected')) }} udziałów</div>
            </div>
            
            <div class="status-card" @click="filterByStatus('smr')" style="cursor: pointer;">
              <div class="status-icon">🏗️</div>
              <div class="status-count">{{ statistics.statusCounts.smr }}</div>
              <div class="status-label">SMR</div>
              <div class="status-percentage">{{ getStatusPercentage('smr') }}%</div>
              <div class="status-shares">{{ formatNumber(getStatusShares('smr')) }} udziałów</div>
            </div>

            <div class="status-card" @click="filterByStatus('no_status')" style="cursor: pointer;">
              <div class="status-icon">❔</div>
              <div class="status-count">{{ statistics.statusCounts.no_status }}</div>
              <div class="status-label">Bez statusu</div>
              <div class="status-percentage">{{ getStatusPercentage('no_status') }}%</div>
              <div class="status-shares">{{ formatNumber(getStatusShares('no_status')) }} udziałów</div>
            </div>
          </div>
        </div>
        
        <!-- Detailed Apartment List -->
        <div class="card" style="margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
            <h3 style="margin: 0;">Szczegółowa lista lokali</h3>
            
            <!-- Filter -->
            <div style="display: flex; gap: 10px; align-items: center;">
              <select v-model="selectedStatusFilter" class="status-filter">
                <option value="">Wszystkie statusy</option>
                <option value="lease_agreement">Umowa dzierżawy</option>
                <option value="notice_sent">Wysłane wezwanie</option>
                <option value="collection_date">Planowany odbiór</option>
                <option value="collected">Odebrane</option>
                <option value="smr">SMR</option>
                <option value="no_status">Bez statusu</option>
              </select>
              <button 
                v-if="selectedStatusFilter" 
                @click="clearFilter" 
                class="btn-clear-filter"
                title="Wyczyść filtr"
              >
                ✕
              </button>
            </div>
          </div>
          
          <button class="btn btn-success" style="margin-bottom: 15px;" @click="showAddModal = true">
            ➕ Dodaj lokal
          </button>
          
          <div class="table-container">
            <table class="apartments-table">
              <thead>
                <tr>
                  <th>Numer lokalu</th>
                  <th>Właściciel</th>
                  <th>Udziały</th>
                  <th>Status</th>
                  <th>Data odbioru</th>
                  <th>Źródło</th>
                  <th v-if="authStore.isAdmin" style="width: 60px;">🔒</th>
                  <th style="width: 150px;">Akcje</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(apt, index) in filteredApartments" :key="index">
                  <td>{{ apt.number }}</td>
                  <td>{{ apt.ownerName }}</td>
                  <td class="shares-cell">{{ formatNumber(parseFloat(apt.shareAmount || '0')) }}</td>
                  <td>
                    <span :class="'status-badge status-' + (apt.status || 'none')">
                      {{ getStatusLabel(apt.status) }}
                    </span>
                  </td>
                  <td>{{ apt.collectionDate || '-' }}</td>
                  <td>
                    <span :class="apt.source === 'public' ? 'badge-public' : 'badge-user'">
                      {{ apt.source === 'public' ? 'Publiczny' : 'Użytkownik' }}
                    </span>
                  </td>

                  <!-- Kolumna lockowania -->
                  <td v-if="authStore.isAdmin">
                    <button
                      v-if="apt.source === 'public' && apt.id"
                      @click="toggleLock(apt)"
                      class="btn-lock"
                      :class="{ 'locked': apt.isLocked }"
                      :title="apt.isLocked ? 'Odblokuj lokal' : 'Zablokuj lokal'"
                    >
                      {{ apt.isLocked ? '🔒' : '🔓' }}
                    </button>
                  </td>

                  <!-- Kolumna akcji -->
                  <td>
                    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                      <!-- Przycisk edycji -->
                      <button
                        v-if="canEditApartment(apt)"
                        class="btn-edit"
                        :class="{ 'btn-edit-locked': apt.isLocked && authStore.isAdmin }"
                        @click="editApartment(apt)">
                        {{ apt.isLocked && authStore.isAdmin ? '🔒 Edytuj' : 'Edytuj' }}
                      </button>

                      <!-- Przycisk historii - tylko dla admina -->
                      <button
                        v-if="apt.source === 'public' && apt.id && authStore.isAdmin"
                        class="btn-history"
                        @click="showHistory(apt.id)">
                        📜 Historia
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td :colspan="authStore.isAdmin ? 3 : 2">
                    <strong>SUMA {{ selectedStatusFilter ? '(filtrowane)' : '' }}</strong>
                  </td>
                  <td class="shares-cell"><strong>{{ formatNumber(filteredTotalShares) }}</strong></td>
                  <td :colspan="authStore.isAdmin ? 4 : 3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div v-if="filteredApartments.length === 0" style="text-align: center; padding: 40px; color: #666;">
            Brak lokali pasujących do wybranego filtru
          </div>
        </div>
      </div>
      
      <div v-if="error" class="error" style="margin-top: 20px;">{{ error }}</div>
      <div v-if="success" class="success" style="margin-top: 20px;">{{ success }}</div>
    </div>
    
    <!-- Modal dodawania -->
    <AddApartmentModal
      v-if="showAddModal"
      @added="onApartmentAdded"
      @close="showAddModal = false"
    />
    
    <!-- Modal edycji -->
    <EditApartmentModal
      v-if="showEditModal && apartmentToEdit"
      :apartment="apartmentToEdit"
      @updated="onApartmentUpdated"
      @close="showEditModal = false"
    />

    <!-- Modal historii edycji -->
    <div v-if="showHistoryModal" class="modal-overlay" @click.self="closeHistoryModal">
      <div class="modal-card history-modal">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0;">📜 Historia edycji lokalu</h3>
          <button class="btn-close" @click="closeHistoryModal">&times;</button>
        </div>
        
        <div v-if="historyLoading" style="text-align: center; padding: 40px;">
          Ładowanie historii...
        </div>
        
        <div v-else-if="historyData.length === 0" style="text-align: center; padding: 40px; color: #666;">
          Brak historii edycji dla tego lokalu
        </div>
        
        <div v-else class="history-list">
          <div v-for="entry in historyData" :key="entry.id" class="history-entry">
            <div class="history-header">
              <strong>{{ formatDateTime(entry.editedAt) }}</strong>
              <span :class="entry.editedBy === 'anonymous' ? 'badge-anonymous' : 'badge-user'">
                {{ entry.editedBy === 'anonymous' ? 'Anonim' : entry.editedBy.replace('user:', '') }}
              </span>
            </div>
            
            <div class="history-details">
              <div v-if="entry.ipAddress" style="font-size: 12px; color: #666;">
                IP: {{ entry.ipAddress }}
              </div>
              
              <div style="margin-top: 10px;">
                               <strong>Zmienione pola:</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  <li v-for="(value, key) in entry.changes" :key="key">
                    <code>{{ formatFieldName(key) }}</code>: 
                    <span class="old-value">{{ entry.oldValues[key] || '(puste)' }}</span>
                    →
                    <span class="new-value">{{ value || '(puste)' }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 20px; text-align: right;">
          <button class="btn btn-secondary" @click="closeHistoryModal">Zamknij</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { API_URL } from '../config';
import AddApartmentModal from '../components/AddApartmentModal.vue';
import EditApartmentModal from '../components/EditApartmentModal.vue';

const authStore = useAuthStore();

const statistics = ref<any | null>(null);
const targetShares = ref(10000);
const loading = ref(true);
const error = ref('');
const success = ref('');
const showAddModal = ref(false);
const showEditModal = ref(false);
const apartmentToEdit = ref<any>(null);
const selectedStatusFilter = ref('');

// Zmienne dla historii
const showHistoryModal = ref(false);
const historyData = ref<any[]>([]);
const historyLoading = ref(false);
const historyApartmentId = ref<number | null>(null);

const formatFieldName = (fieldName: string): string => {
  const labels: Record<string, string> = {
    apartmentNumber: 'Numer lokalu',
    ownerFirstName: 'Imię',
    ownerLastName: 'Nazwisko',
    phoneNumber: 'Telefon',
    email: 'Email',
    shareAmount: 'Udziały',
    status: 'Status',
    collectionDate: 'Data odbioru',
    additionalInfo: 'Dodatkowe informacje'
  };
  return labels[fieldName] || fieldName;
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const fetchStatistics = async () => {
  try {
    loading.value = true;
    error.value = '';
    const response = await axios.get(`${API_URL}/statistics/apartments`);
    statistics.value = response.data;
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Błąd pobierania statystyk';
  } finally {
    loading.value = false;
  }
};

const fetchSettings = async () => {
  try {
    const response = await axios.get(`${API_URL}/settings`);
    targetShares.value = response.data.totalSharesTarget || 10000;
  } catch (err: any) {
    console.error('Błąd pobierania ustawień:', err);
    targetShares.value = 10000;
  }
};

const updateSettings = async () => {
  try {
    error.value = '';
    success.value = '';
    await axios.put(`${API_URL}/settings`, {
      totalSharesTarget: targetShares.value
    });
    
    success.value = 'Ustawienia zapisane pomyślnie';
    await fetchStatistics();
    
    setTimeout(() => {
      success.value = '';
    }, 3000);
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Błąd zapisu ustawień';
  }
};

const formatNumber = (num: number): string => {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const getStatusLabel = (status?: string): string => {
  const labels: Record<string, string> = {
    'lease_agreement': 'Umowa dzierżawy',
    'notice_sent': 'Wysłane wezwanie',
    'collection_date': 'Planowany odbiór',
    'collected': 'Odebrane',
    'smr': 'SMR',
  };
  return labels[status || ''] || 'Bez statusu';
};

const getStatusShares = (status: string): number => {
  if (!statistics.value?.statusGroups) return 0;
  const groupKey = status === 'no_status' ? 'no_status' : status;
  const group = statistics.value.statusGroups[groupKey] || [];
  return group.reduce((sum: number, apt: any) => {
    return sum + parseFloat(apt.shareAmount || '0');
  }, 0);
};

const getStatusPercentage = (status: string): string => {
  if (!statistics.value?.totalSharesTarget) return '0.00';
  const shares = getStatusShares(status);
  const percentage = (shares / statistics.value.totalSharesTarget) * 100;
  return percentage.toFixed(2);
};

const filterByStatus = (status: string) => {
  selectedStatusFilter.value = status;
};

const clearFilter = () => {
  selectedStatusFilter.value = '';
};

const filteredApartments = computed(() => {
  if (!statistics.value?.apartments) return [];
  if (!selectedStatusFilter.value) return statistics.value.apartments;
  if (selectedStatusFilter.value === 'no_status') {
    return statistics.value.apartments.filter((apt: any) => !apt.status);
  }
  
  return statistics.value.apartments.filter(
    (apt: any) => apt.status === selectedStatusFilter.value
  );
});

const filteredTotalShares = computed(() => {
  return filteredApartments.value.reduce((sum: number, apt: any) => {
    return sum + parseFloat(apt.shareAmount || '0');
  }, 0);
});

// 🆕 ZAKTUALIZOWANA funkcja canEditApartment
const canEditApartment = (apt: any): boolean => {
  // Publiczne lokale
  if (apt.source === 'public') {
    // Jeśli zablokowany - tylko admin
    if (apt.isLocked) {
      return authStore.isAdmin || false;
    }
    // Jeśli odblokowany - wszyscy
    return true;
  }
  
  // Lokale użytkowników
  if (!authStore.isAuthenticated) return false;
  if (authStore.isAdmin) return true;
  if (apt.source === 'user' && apt.ownerLogin === authStore.user?.login) return true;
  
  return false;
};

const onApartmentAdded = () => {
  fetchStatistics();
  showAddModal.value = false;
};

// 🆕 POPRAWIONA funkcja editApartment - przekazanie isLocked
const editApartment = (apt: any) => {
  apartmentToEdit.value = {
    ...apt,
    _source: apt.source,
    _ownerLogin: apt.ownerLogin,
    _originalNumber: apt.number,
    _id: apt.id,
    _userId: apt.userId,
    isLocked: apt.isLocked // 🆕 DODANE: Przekaż status blokady
  };
  showEditModal.value = true;
};

const onApartmentUpdated = () => {
  fetchStatistics();
  showEditModal.value = false;
  apartmentToEdit.value = null;
};

// 🆕 POPRAWIONA funkcja showHistory - dodano token autoryzacji
const showHistory = async (aptId: number) => {
  try {
    historyLoading.value = true;
    historyApartmentId.value = aptId;
    
    const response = await axios.get(
      `${API_URL}/public-apartments/${aptId}/history`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}` // 🆕 DODANE: Token
        }
      }
    );
    
    historyData.value = response.data;
    showHistoryModal.value = true;
  } catch (err: any) {
    console.error('Błąd pobierania historii:', err);
    error.value = err.response?.data?.error || 'Błąd pobierania historii edycji';
  } finally {
    historyLoading.value = false;
  }
};

const closeHistoryModal = () => {
  showHistoryModal.value = false;
  historyData.value = [];
  historyApartmentId.value = null;
};

// 🆕 NOWA funkcja toggleLock
const toggleLock = async (apt: any) => {
  if (!authStore.isAdmin) {
    error.value = 'Tylko administrator może blokować lokale';
    return;
  }

  if (apt.source !== 'public' || !apt.id) {
    error.value = 'Można blokować tylko publiczne lokale';
    return;
  }

  try {
    const response = await axios.put(
      `${API_URL}/public-apartments/${apt.id}/lock`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      }
    );

    const newLockState = response.data.isLocked;
    
    success.value = newLockState 
      ? `🔒 Lokal ${apt.number} został zablokowany`
      : `🔓 Lokal ${apt.number} został odblokowany`;
    
    // Odśwież statystyki
    await fetchStatistics();
    
    setTimeout(() => {
      success.value = '';
    }, 3000);

  } catch (err: any) {
    console.error('Błąd lockowania:', err);
    error.value = err.response?.data?.error || 'Błąd zmiany stanu blokady';
  }
};

onMounted(async () => {
  await fetchSettings();
  await fetchStatistics();
});
</script>

<style scoped>
/* ========================================
   MODAL STYLES
   ======================================== */

/* Overlay - przyciemnione tło */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}

/* Card - białe okienko */
.modal-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 600px;
  position: relative;
  margin: auto;
}

/* Modal historii - specjalne wymiary */
.history-modal {
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  background-color: #ffffff;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.history-entry {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 15px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #dee2e6;
}

.history-details {
  font-size: 14px;
  color: #333;
}

.history-details ul {
  list-style: none;
  padding-left: 0;
  margin: 5px 0;
}

.history-details li {
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.history-details li:last-child {
  border-bottom: none;
}

.old-value {
  color: #dc3545;
  text-decoration: line-through;
  font-weight: 500;
}

.new-value {
  color: #28a745;
  font-weight: 600;
}

code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  font-family: 'Courier New', monospace;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: #999;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #333;
}

.btn-history {
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-history:hover {
  background: #138496;
}

.badge-anonymous {
  background: #f0f0f0;
  color: #666;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

/* 🔒 Lock button styles */
.btn-lock {
  background: transparent;
  border: 2px solid #6c757d;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
  min-width: 40px;
  height: 32px;
}

.btn-lock:hover {
  background: #f8f9fa;
  transform: scale(1.1);
}

.btn-lock.locked {
  border-color: #dc3545;
  background: #fff5f5;
}

.btn-lock.locked:hover {
  background: #ffe0e0;
  border-color: #c82333;
}

/* 🔒 Locked edit button */
.btn-edit-locked {
  background: #dc3545 !important;
  color: white !important;
  border: 2px solid #bd2130;
}

.btn-edit-locked:hover {
  background: #c82333 !important;
  border-color: #a71d2a;
}

/* ========================================
   MAIN STYLES
   ======================================== */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-card-shares {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card-target {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card-percentage {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-icon {
  font-size: 40px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 5px;
}

.progress-container {
  width: 100%;
  height: 40px;
  background-color: #e9ecef;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.5s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
}

.progress-text {
  color: white;
  font-weight: bold;
  font-size: 16px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.status-card {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #dee2e6;
  transition: all 0.2s;
  cursor: pointer;
}

.status-card:hover {
  background: #e9ecef;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.status-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.status-count {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.status-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.status-percentage {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 4px;
}

.status-shares {
  font-size: 12px;
  color: #888;
}

.status-filter {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.status-filter:focus {
  outline: none;
  border-color: #667eea;
}

.btn-clear-filter {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-clear-filter:hover {
  background: #c82333;
}

.table-container {
  overflow-x: auto;
}

.apartments-table {
  width: 100%;
  border-collapse: collapse;
}

.apartments-table th {
  background-color: #f8f9fa;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
}

.apartments-table td {
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
}

.apartments-table tbody tr:hover {
  background-color: #f8f9fa;
}

.shares-cell {
  text-align: right;
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-lease_agreement {
  background-color: #d1ecf1;
  color: #0c5460;
}

.status-notice_sent {
  background-color: #fff3cd;
  color: #856404;
}

.status-collection_date {
  background-color: #d4edda;
  color: #155724;
}

.status-collected {
  background-color: #d4edda;
  color: #155724;
}

.status-smr {
  background-color: #e7e7ff;
  color: #4a4aff;
}

.status-none {
  background-color: #e2e3e5;
  color: #383d41;
}

.total-row {
  background-color: #f8f9fa;
  font-weight: bold;
}

.total-row td {
  border-top: 2px solid #333;
  border-bottom: 2px solid #333;
}

.badge-public {
  background: #ffe5e5;
  color: #c41e3a;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-user {
  background: #e0f7fa;
  color: #00796b;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.btn-edit {
  background: #ffc107;
  color: #000;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-edit:hover {
  background: #ffb300;
}

.btn-success {
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-success:hover {
  background: #218838;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #5568d3;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #f5c6cb;
}

.success {
  background: #d4edda;
  color: #155724;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #c3e6cb;
}

/* ========================================
   RESPONSIVE STYLES
   ======================================== */

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 28px;
  }

  .stat-icon {
    font-size: 32px;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .status-icon {
    font-size: 30px;
  }

  .status-count {
    font-size: 24px;
  }

  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .apartments-table {
    min-width: 800px;
  }

  .apartments-table th,
  .apartments-table td {
    padding: 8px 6px;
    font-size: 13px;
  }

  .shares-cell {
    font-size: 13px;
  }
  
  .btn-edit,
  .btn-history {
    padding: 4px 8px;
    font-size: 11px;
  }

  .btn-lock {
    font-size: 16px;
    padding: 3px 6px;
    min-width: 35px;
    height: 28px;
  }

  .modal-overlay {
    padding: 10px;
  }
  
  .modal-card {
    padding: 20px;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .history-modal {
    max-width: 95%;
    padding: 15px;
  }
  
  .history-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .stat-card {
    flex-direction: column;
    text-align: center;
    padding: 15px;
  }

  .stat-icon {
    font-size: 36px;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-label {
    font-size: 13px;
  }

  .progress-container {
    height: 30px;
  }

  .progress-text {
    font-size: 14px;
  }

  .status-card {
    padding: 15px;
  }

  .status-icon {
    font-size: 28px;
  }

  .status-count {
    font-size: 20px;
  }

  .apartments-table {
    font-size: 12px;
    min-width: 750px;
  }

  .apartments-table th,
  .apartments-table td {
    padding: 6px 4px;
  }
  
  .badge-public,
  .badge-user {
    font-size: 10px;
    padding: 3px 6px;
  }
  
  .btn-success {
    width: 100%;
    margin-bottom: 10px;
  }

  .btn-edit,
  .btn-history {
    font-size: 10px;
    padding: 3px 6px;
  }

  .btn-lock {
    font-size: 14px;
    padding: 2px 4px;
    min-width: 30px;
    height: 24px;
  }

  .modal-card {
    padding: 15px;
  }

  .btn-close {
    font-size: 24px;
    width: 24px;
    height: 24px;
  }
}
</style>

 
