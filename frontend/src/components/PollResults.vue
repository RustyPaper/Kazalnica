<template>
  <div class="poll-results">
    <div class="results-header">
      <h3>📊 Wyniki głosowania</h3>
      <button 
        v-if="allowBackToVote"
        @click="$emit('backToVote')" 
        class="btn-back-to-vote"
      >
        ← Powrót do głosowania
      </button>
      <div v-if="isAdmin" class="admin-actions">
      <button @click="exportResults" class="btn-export">
        📥 Eksportuj do CSV
      </button>
    </div>
    </div>

    <div v-if="loading" class="loading">Ładowanie wyników...</div>

    <div v-else-if="results" class="results-content">
      <!-- Statystyki -->
      <div class="stats-summary">
        <div class="stat-item">
          <div class="stat-value">{{ results.totalVotes }}</div>
          <div class="stat-label">Głosów</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ results.totalShares.toFixed(2) }}</div>
          <div class="stat-label">Udziałów</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ results.results.length }}</div>
          <div class="stat-label">Opcji</div>
        </div>
      </div>

      <!-- Wyniki opcji -->
      <div class="options-results">
        <div 
          v-for="result in sortedResults" 
          :key="result.optionId"
          class="result-item"
        >
          <div class="result-header">
            <h4>{{ result.optionText }}</h4>
            <span class="result-percentage">{{ result.percentage.toFixed(1) }}%</span>
          </div>

          <div class="progress-bar">
            <div 
              class="progress-fill"
              :style="{ width: result.percentage + '%' }"
              :class="{ 'winner': isWinner(result) }"
            ></div>
          </div>

          <div class="result-details">
            <span>🗳️ {{ result.voteCount }} głosów</span>
            <span>📊 {{ result.shareCount.toFixed(2) }} udziałów</span>
          </div>

          <div v-if="isWinner(result)" class="winner-badge">
            🏆 Zwycięzca
          </div>
        </div>
      </div>

      <!-- Szczegółowe głosy (opcjonalnie - dla admina) -->
      <div v-if="showDetailedVotes && isAdmin" class="detailed-votes">
        <h4>📋 Szczegółowe głosy</h4>
        <button @click="fetchDetailedVotes" class="btn-load-details">
          Załaduj szczegóły
        </button>
        <!-- TODO: Implementacja szczegółowych głosów -->
      </div>
    </div>

    <div v-else class="error">
      Nie udało się załadować wyników
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getPollResults } from '../api/polls';
import type { PollWithResults } from '../types/index.ts';
import { useAuthStore } from '../stores/auth.ts';
import axios from 'axios';

interface Props {
  pollId: string;
  allowBackToVote?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['backToVote']);

const userStore = useAuthStore();

const results = ref<PollWithResults | null>(null);
const loading = ref(true);
const showDetailedVotes = ref(false);

const isAdmin = computed(() => userStore.user?.role === 'admin');

const sortedResults = computed(() => {
  if (!results.value) return [];
  return [...results.value.results].sort((a, b) => b.percentage - a.percentage);
});

const isWinner = (result: any) => {
  if (!results.value || results.value.totalShares === 0) return false;
  return result.percentage === Math.max(...results.value.results.map(r => r.percentage));
};

const fetchResults = async () => {
  try {
    loading.value = true;
    results.value = await getPollResults(props.pollId);
  } catch (error) {
    console.error('Error fetching results:', error);
  } finally {
    loading.value = false;
  }
};

const fetchDetailedVotes = () => {
  // TODO: Implementacja pobierania szczegółowych głosów
  alert('Funkcja w przygotowaniu');
};

onMounted(() => {
  fetchResults();
});

const exportResults = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `/api/polls/${props.pollId}/export`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      }
    );
    
    // Pobierz plik
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wyniki-ankiety-${props.pollId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
  } catch (error) {
    console.error('Error exporting:', error);
    alert('Błąd eksportu wyników');
  }
};
</script>

<style scoped>
.poll-results {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 2rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.results-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.btn-back-to-vote {
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn-back-to-vote:hover {
  background: #5a6268;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.error {
  text-align: center;
  padding: 3rem;
  color: #dc3545;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-item {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #6c757d;
  font-size: 0.9rem;
}

.options-results {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.result-item {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.result-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.result-percentage {
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
}

.progress-bar {
  background: #e9ecef;
  border-radius: 10px;
  height: 30px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #0056b3);
  transition: width 0.5s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  color: white;
  font-weight: bold;
}

.progress-fill.winner {
  background: linear-gradient(90deg, #28a745, #218838);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.result-details {
  display: flex;
  gap: 1.5rem;
  color: #6c757d;
  font-size: 0.95rem;
}

.winner-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #856404;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

.detailed-votes {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #dee2e6;
}

.detailed-votes h4 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.btn-load-details {
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-load-details:hover {
  background: #0056b3;
}

.admin-actions {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #dee2e6;
}

.btn-export {
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-export:hover {
  background: #138496;
}

@media (max-width: 768px) {
  .stats-summary {
    grid-template-columns: 1fr;
  }
  
  .results-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .winner-badge {
    position: static;
    display: inline-block;
    margin-top: 1rem;
  }
}
</style>
