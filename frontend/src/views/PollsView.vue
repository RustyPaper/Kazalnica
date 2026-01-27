<template>
  <div class="polls-view">
    <div class="polls-header">
      <h1>📊 Ankiety</h1>
      
      <button 
        v-if="isAdmin" 
        @click="showCreateModal = true"
        class="btn-primary"
      >
        ➕ Nowa ankieta
      </button>
    </div>

    <!-- Lista ankiet -->
    <div v-if="polls.length > 0" class="polls-list">
      <div 
        v-for="poll in polls" 
        :key="poll.id"
        class="poll-card"
        :class="{ 'poll-closed': poll.isClosed }"
      >
        <div class="poll-header">
          <h3>
            {{ poll.title }}
            <span v-if="poll.isClosed" class="lock-icon" title="Ankieta zamknięta">🔒</span>
          </h3>
          <p v-if="poll.description" class="poll-description">{{ poll.description }}</p>
        </div>

        <div class="poll-meta">
          <span class="poll-date">
            📅 {{ formatDate(poll.createdAt) }}
          </span>
          <span v-if="poll.closesAt && !poll.isClosed" class="poll-closes">
            ⏰ Zamyka się: {{ formatDate(poll.closesAt) }}
          </span>
          <span v-if="poll.createdByName" class="poll-author">
            👤 {{ poll.createdByName }}
          </span>
        </div>

        <div class="poll-actions">
          <button @click="viewPoll(poll.id)" class="btn-secondary">
            {{ poll.isClosed ? '📊 Zobacz wyniki' : '🗳️ Głosuj' }}
          </button>
          
          <template v-if="isAdmin">
            <button 
              v-if="!poll.isClosed"
              @click="closePollConfirm(poll.id)" 
              class="btn-warning"
            >
              🔒 Zamknij
            </button>
            <button 
              v-else
              @click="reopenPollAction(poll.id)" 
              class="btn-success"
            >
              🔓 Otwórz ponownie
            </button>
            <button 
              @click="deletePollConfirm(poll.id)" 
              class="btn-danger"
            >
              🗑️ Usuń
            </button>
          </template>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>📭 Brak ankiet</p>
      <p v-if="isAdmin" class="hint">Utwórz pierwszą ankietę klikając "Nowa ankieta"</p>
    </div>

    <!-- Modal tworzenia ankiety -->
    <CreatePollModal 
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="onPollCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.ts';
import { getPolls, closePoll, reopenPoll, deletePoll } from '../api/polls';
import type { Poll } from '../types/index.ts';
import CreatePollModal from '../components/CreatePollModal.vue';

const router = useRouter();
const userStore = useAuthStore();

const polls = ref<Poll[]>([]);
const showCreateModal = ref(false);
const loading = ref(false);

const isAdmin = computed(() => userStore.user?.role === 'admin');

const fetchPolls = async () => {
  try {
    loading.value = true;
    polls.value = await getPolls();
  } catch (error) {
    console.error('Error fetching polls:', error);
    alert('Błąd pobierania ankiet');
  } finally {
    loading.value = false;
  }
};

const viewPoll = (pollId: string) => {
  router.push(`/polls/${pollId}`);
};

const closePollConfirm = async (pollId: string) => {
  if (!confirm('Czy na pewno chcesz zamknąć tę ankietę?')) return;
  
  try {
    await closePoll(pollId);
    await fetchPolls();
  } catch (error) {
    console.error('Error closing poll:', error);
    alert('Błąd zamykania ankiety');
  }
};

const reopenPollAction = async (pollId: string) => {
  try {
    await reopenPoll(pollId);
    await fetchPolls();
  } catch (error) {
    console.error('Error reopening poll:', error);
    alert('Błąd otwierania ankiety');
  }
};

const deletePollConfirm = async (pollId: string) => {
  if (!confirm('Czy na pewno chcesz usunąć tę ankietę? Ta operacja jest nieodwracalna!')) return;
  
  try {
    await deletePoll(pollId);
    await fetchPolls();
  } catch (error) {
    console.error('Error deleting poll:', error);
    alert('Błąd usuwania ankiety');
  }
};

const onPollCreated = () => {
  showCreateModal.value = false;
  fetchPolls();
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  fetchPolls();
});
</script>

<style scoped>
.polls-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.polls-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.polls-header h1 {
  font-size: 2rem;
  color: #2c3e50;
}

.polls-list {
  display: grid;
  gap: 1.5rem;
}

.poll-card {
  background: white;
  border-radius: 12px;
  padding: 1
.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.poll-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.poll-card.poll-closed {
  background: #f8f9fa;
  border-left: 4px solid #6c757d;
}

.poll-header h3 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lock-icon {
  font-size: 1.2rem;
  opacity: 0.6;
}

.poll-description {
  color: #6c757d;
  margin-bottom: 1rem;
}

.poll-meta {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin: 1rem 0;
  font-size: 0.9rem;
  color: #6c757d;
}

.poll-meta span {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.poll-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary, .btn-warning, .btn-success, .btn-danger {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #28a745;
  color: white;
}

.btn-secondary:hover {
  background: #218838;
}

.btn-warning {
  background: #ffc107;
  color: #000;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-success {
  background: #17a2b8;
  color: white;
}

.btn-success:hover {
  background: #138496;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6c757d;
}

.empty-state p:first-child {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state .hint {
  font-size: 0.95rem;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .polls-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .poll-actions {
    flex-direction: column;
  }
  
  .poll-actions button {
    width: 100%;
  }
}
</style>
