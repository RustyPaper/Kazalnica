<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <h3>⚠️ Lokal już istnieje</h3>
      
      <div class="info-box">
        <p><strong>Numer lokalu:</strong> {{ apartmentData.number }}</p>
        
        <div v-if="apartmentData.source === 'user'" class="owner-info">
          <p class="warning">
            ⚠️ Ten lokal jest już przypisany do użytkownika: 
            <strong>{{ apartmentData.owner.name }}</strong>
          </p>
          <p class="error-text">
            Nie możesz dodać tego lokalu. Każdy lokal może być przypisany tylko do jednego użytkownika.
          </p>
        </div>
        
        <div v-else class="public-info">
          <p class="info-text">
            ℹ️ Ten lokal znajduje się na liście publicznej.
          </p>
          
          <div class="existing-data" v-if="hasExistingData">
            <h4>Obecne dane:</h4>
            <ul>
              <li v-if="apartmentData.apartment.ownerFirstName || apartmentData.apartment.ownerLastName">
                <strong>Właściciel:</strong> 
                {{ apartmentData.apartment.ownerFirstName }} {{ apartmentData.apartment.ownerLastName }}
              </li>
              <li v-if="apartmentData.apartment.shareAmount">
                <strong>Udziały:</strong> {{ apartmentData.apartment.shareAmount }}
              </li>
              <li v-if="apartmentData.apartment.status">
                <strong>Status:</strong> {{ getStatusLabel(apartmentData.apartment.status) }}
              </li>
              <li v-if="apartmentData.apartment.additionalInfo">
                <strong>Info:</strong> {{ apartmentData.apartment.additionalInfo }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
      <div v-if="successMsg" class="success">{{ successMsg }}</div>
      
      <div class="modal-actions">
        <!-- Opcje dla publicznego lokalu -->
        <template v-if="apartmentData.source === 'public' && isAuthenticated">
          <button 
            @click="claimApartment" 
            class="btn btn-primary"
            :disabled="loading"
          >
            {{ loading ? 'Przypisuję...' : '✅ Przypisz do mojego konta' }}
          </button>
          
          <button 
            @click="editPublic" 
            class="btn btn-secondary"
          >
            ✏️ Edytuj publiczny wpis
          </button>
        </template>
        
        <!-- Opcja edycji dla niezalogowanych -->
        <template v-else-if="apartmentData.source === 'public' && !isAuthenticated">
          <button 
            @click="editPublic" 
            class="btn btn-primary"
          >
            ✏️ Edytuj istniejący wpis
          </button>
        </template>
        
        <!-- Brak opcji dla lokalu użytkownika -->
        <button @click="$emit('close')" class="btn btn-cancel">
          Zamknij
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import axios from 'axios'
import { API_URL } from '../config'
import { useAuthStore } from '../stores/auth'

interface Props {
  apartmentData: any
}

const props = defineProps<Props>()
const authStore = useAuthStore()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'claimed'): void
  (e: 'edit', apartmentId: number): void
}>()

const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const isAuthenticated = computed(() => authStore.isAuthenticated)

const hasExistingData = computed(() => {
  const apt = props.apartmentData.apartment
  return apt.ownerFirstName || apt.ownerLastName || apt.shareAmount || apt.status || apt.additionalInfo
})

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'lease_agreement': 'Umowa dzierżawy',
    'notice_sent': 'Wysłane wezwanie',
    'collection_date': 'Planowany odbiór',
    'collected': 'Odebrane',
    'smr': 'SMR'
  }
  return labels[status] || status
}

const claimApartment = async () => {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  
  try {
    const publicApartmentId = props.apartmentData.apartment.id
    
    console.log(`🔄 Przypisuję lokal #${publicApartmentId} do konta`)
    
    await axios.post(
      `${API_URL}/apartments/claim/${publicApartmentId}`,
      {}, // Można przesłać nadpisujące dane, ale na razie puste
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      }
    )
    
    successMsg.value = '✅ Lokal został przypisany do Twojego konta!'
    
    setTimeout(() => {
      emit('claimed')
      emit('close')
    }, 1500)
    
  } catch (error: any) {
    console.error('❌ Błąd przypisywania lokalu:', error)
    errorMsg.value = error.response?.data?.error || 'Nie udało się przypisać lokalu'
  } finally {
    loading.value = false
  }
}

const editPublic = () => {
  const apartmentId = props.apartmentData.apartment.id
  emit('edit', apartmentId)
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 550px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-card h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 22px;
}

.info-box {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.info-box p {
  margin: 5px 0;
}

.owner-info {
  margin-top: 15px;
}

.warning {
  color: #856404;
  background: #fff3cd;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ffc107;
}

.error-text {
  color: #721c24;
  background: #f8d7da;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #f5c6cb;
  margin-top: 10px;
}

.public-info {
  margin-top: 10px;
}

.info-text {
  color: #004085;
  background: #cce5ff;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #b8daff;
}

.existing-data {
  margin-top: 15px;
  padding: 10px;
  background: white;
  border-radius: 6px;
}

.existing-data h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #495057;
}

.existing-data ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.existing-data li {
  padding: 5px 0;
  font-size: 14px;
  color: #333;
}

.error {
  color: #dc3545;
  background: #f8d7da;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 14px;
}

.success {
  color: #155724;
  background: #d4edda;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #28a745;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #218838;
}

.btn-secondary {
  background: #ffc107;
  color: #000;
}

.btn-secondary:hover {
  background: #e0a800;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background: #5a6268;
}

@media (max-width: 480px) {
  .modal-card {
    padding: 20px;
  }
  
  .modal-card h3 {
    font-size: 18px;
  }
  
  .existing-data h4 {
    font-size: 13px;
  }
  
  .existing-data li {
    font-size: 13px;
  }
}
</style>

