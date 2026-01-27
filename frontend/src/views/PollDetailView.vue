<template>
  <div class="poll-detail-view">
    <div v-if="loading" class="loading">Ładowanie...</div>

    <div v-else-if="poll" class="poll-container">
      <!-- Header -->
      <div class="poll-header">
        <button @click="goBack" class="btn-back">← Powrót</button>
        <h1>
          {{ poll.title }}
          <span v-if="poll.isClosed" class="lock-icon" title="Ankieta zamknięta">🔒</span>
        </h1>
        <p v-if="poll.description" class="poll-description">{{ poll.description }}</p>
      </div>

      <!-- ⭐ Zakładki (Tabs) -->
      <div class="tabs" v-if="!poll.isClosed">
        <button 
          @click="showResults = false" 
          :class="{ active: !showResults }"
          class="tab-btn"
        >
          🗳️ Głosowanie
        </button>
        <button 
          @click="showResults = true" 
          :class="{ active: showResults }"
          class="tab-btn"
        >
          📊 Wyniki
        </button>
      </div>

      <!-- Formularz głosowania (jeśli otwarta) -->
      <VoteForm
        v-if="!poll.isClosed && !showResults"
        :poll="poll"
        @voted="onVoted"
        @showResults="showResults = true"
      />

      <!-- Wyniki -->
      <PollResults
        v-if="showResults || poll.isClosed"
        :pollId="poll.id"
        @backToVote="showResults = false"
        :allowBackToVote="!poll.isClosed"
      />
    </div>

    <div v-else class="error">
      Ankieta nie znaleziona
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getPoll } from '../api/polls';
import type { PollWithOptions } from '../types/index';
import VoteForm from '../components/VoteForm.vue';
import PollResults from '../components/PollResults.vue';

const route = useRoute();
const router = useRouter();

const poll = ref<PollWithOptions | null>(null);
const loading = ref(true);
const showResults = ref(false);

const fetchPoll = async (): Promise<void> => {
  try {
    loading.value = true;
    const pollId = route.params.id as string;
    poll.value = await getPoll(pollId);
    
    // ⭐ Jeśli ankieta zamknięta, od razu pokaż wyniki
    if (poll.value.isClosed) {
      showResults.value = true;
    }
  } catch (error) {
    console.error('Error fetching poll:', error);
  } finally {
    loading.value = false;
  }
};

const onVoted = (): void => {
  showResults.value = true;
  fetchPoll(); // Odśwież dane po głosowaniu
};

const goBack = (): void => {
  router.push('/polls');
};

// ⭐ ZMODYFIKOWANY onMounted - obsługa ?tab=results
onMounted(async () => {
  await fetchPoll();
  
  // Jeśli URL zawiera ?tab=results, pokaż od razu wyniki
  if (route.query.tab === 'results') {
    showResults.value = true;
  }
});
</script>

<style scoped>
.poll-detail-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.loading {
  text-align: center;
  padding: 4rem;
  font-size: 1.2rem;
  color: #6c757d;
}

.error {
  text-align: center;
  padding: 4rem;
  color: #dc3545;
  font-size: 1.2rem;
}

.poll-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.poll-header {
  margin-bottom: 2rem;
}

.btn-back {
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-back:hover {
  background: #5a6268;
}

.poll-header h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lock-icon {
  font-size: 1.5rem;
  opacity: 0.6;
}

.poll-description {
  color: #6c757d;
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

/* ⭐ NOWE: Style dla zakładek */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #dee2e6;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  color: #6c757d;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  font-weight: 500;
}

.tab-btn:hover {
  color: #007bff;
  background: #f8f9fa;
}

.tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

@media (max-width: 768px) {
  .poll-detail-view {
    padding: 1rem;
  }
  
  .poll-container {
    padding: 1.5rem;
  }
  
  .poll-header h1 {
    font-size: 1.5rem;
  }

  .tabs {
    gap: 0;
  }

  .tab-btn {
    flex: 1;
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
  }
}
</style>
