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
import type { PollWithOptions } from '../types/polls';
import VoteForm from '../components/VoteForm.vue';
import PollResults from '../components/PollResults.vue';

const route = useRoute();
const router = useRouter();

const poll = ref<PollWithOptions | null>(null);
const loading = ref(true);
const showResults = ref(false);

const fetchPoll = async () => {
  try {
    loading.value = true;
    const pollId = route.params.id as string;
    poll.value = await getPoll(pollId);
    
    // Jeśli ankieta zamknięta, od razu pokaż wyniki
    if (poll.value.isClosed) {
      showResults.value = true;
    }
  } catch (error) {
    console.error('Error fetching poll:', error);
  } finally {
    loading.value = false;
  }
};

const onVoted = () => {
  showResults.value = true;
};

const goBack = () => {
  router.push('/polls');
};

onMounted(() => {
  fetchPoll();
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
}
</style>

