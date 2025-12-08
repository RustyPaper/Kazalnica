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
            <div class="status-card">
              <div class="status-icon">📄</div>
              <div class="status-count">{{ statistics.statusCounts.lease_agreement }}</div>
              <div class="status-label">Umowa dzierżawy</div>
            </div>
            
            <div class="status-card">
              <div class="status-icon">📧</div>
              <div class="status-count">{{ statistics.statusCounts.notice_sent }}</div>
              <div class="status-label">Wysłane wezwanie</div>
            </div>
            
            <div class="status-card">
              <div class="status-icon">📅</div>
              <div class="status-count">{{ statistics.statusCounts.collection_date }}</div>
              <div class="status-label">Planowany odbiór</div>
            </div>
            
            <div class="status-card">
              <div class="status-icon">✅</div>
              <div class="status-count">{{ statistics.statusCounts.collected }}</div>
              <div class="status-label">Odebrane</div>
            </div>
            
            <div class="status-card">
              <div class="status-icon">❔</div>
              <div class="status-count">{{ statistics.statusCounts.no_status }}</div>
              <div class="status-label">Bez statusu</div>
            </div>
          </div>
        </div>
        
        <!-- Detailed Apartment List -->
        <div class="card" style="margin-top: 20px;">
          <h3 style="margin-bottom: 15px;">Szczegółowa lista lokali</h3>
          
          <div class="table-container">
            <table class="apartments-table">
              <thead>
                <tr>
                  <th>Numer lokalu</th>
                  <th>Właściciel</th>
                  <th>Udziały</th>
                  <th>Status</th>
                  <th>Data odbioru</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(apt, index) in statistics.apartments" :key="index">
                  <td>{{ apt.number }}</td>
                  <td>{{ apt.ownerName }}</td>
                  <td class="shares-cell">{{ formatNumber(parseFloat(apt.shareAmount || '0')) }}</td>
                  <td>
                    <span :class="'status-badge status-' + (apt.status || 'none')">
                      {{ getStatusLabel(apt.status) }}
                    </span>
                  </td>
                  <td>{{ apt.collectionDate || '-' }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="2"><strong>SUMA</strong></td>
                  <td class="shares-cell"><strong>{{ formatNumber(statistics.totalShares) }}</strong></td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
      
      <div v-if="error" class="error" style="margin-top: 20px;">{{ error }}</div>
      <div v-if="success" class="success" style="margin-top: 20px;">{{ success }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import type { ApartmentStatistics } from '../types';
import { API_URL } from '../config';

const authStore = useAuthStore();
//const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const statistics = ref<ApartmentStatistics | null>(null);
const targetShares = ref(10000);
const loading = ref(true);
const error = ref('');
const success = ref('');

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
    targetShares.value = 10000; // Domyślna wartość
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
  };
  return labels[status || ''] || 'Bez statusu';
};

onMounted(async () => {
  await fetchSettings();
  await fetchStatistics();
});
</script>

<style scoped>
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

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .table-container {
    font-size: 14px;
  }
  
  .apartments-table th,
  .apartments-table td {
    padding: 8px;
  }
}
</style>

