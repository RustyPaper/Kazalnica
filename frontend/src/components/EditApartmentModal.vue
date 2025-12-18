<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-card">
      <h3>Edytuj lokal</h3>
      
      <!-- Info dla admina edytującego lokal użytkownika -->
      <div v-if="apartment._source === 'user' && authStore.isAdmin" class="admin-notice">
        ⚠️ Edytujesz lokal użytkownika: <strong>{{ apartment.ownerName }}</strong>
      </div>
      
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Numer lokalu*:</label>
          <input v-model="form.apartmentNumber" required />
        </div>
        
        <!-- Pola dla publicznych lokali -->
        <template v-if="apartment._source === 'public'">
          <div class="form-group">
            <label>Imię:</label>
            <input v-model="form.ownerFirstName" />
          </div>
          
          <div class="form-group">
            <label>Nazwisko:</label>
            <input v-model="form.ownerLastName" />
          </div>
          
          <div class="form-group">
            <label>Numer telefonu:</label>
            <input v-model="form.phoneNumber" />
          </div>
          
          <div class="form-group">
            <label>Email:</label>
            <input type="email" v-model="form.email" />
          </div>
        </template>
        
        <div class="form-group">
          <label>Ilość udziałów:</label>
          <input type="number" step="0.01" v-model="form.shareAmount" />
        </div>
        
        <div class="form-group">
          <label>Status:</label>
          <select v-model="form.status">
            <option value="">Brak</option>
            <option value="lease_agreement">Umowa dzierżawy</option>
            <option value="notice_sent">Wysłane wezwanie</option>
            <option value="collection_date">Planowany odbiór</option>
            <option value="collected">Odebrane</option>
            <option value="smr">SMR</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Data odbioru:</label>
          <input type="date" v-model="form.collectionDate" />
        </div>
        
        <div class="form-group">
          <label>Dodatkowe informacje:</label>
          <textarea v-model="form.additionalInfo" rows="3"></textarea>
        </div>
        
        <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
        <div v-if="successMsg" class="success">{{ successMsg }}</div>
        
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Zapisywanie...' : 'Zapisz' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="emit('close')">
            Anuluj
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { API_URL } from '../config'
import { useAuthStore } from '../stores/auth'

interface Props {
  apartment: any
}

const props = defineProps<Props>()
const authStore = useAuthStore()

const emit = defineEmits<{
  updated: []
  close: []
}>()

const form = ref({
  apartmentNumber: '',
  ownerFirstName: '',
  ownerLastName: '',
  phoneNumber: '',
  email: '',
  shareAmount: '',
  status: '',
  collectionDate: '',
  additionalInfo: ''
})

const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)

onMounted(() => {
  if (props.apartment) {
    const apt = props.apartment
    
    form.value = {
      apartmentNumber: apt.number || apt.apartmentNumber || '',
      ownerFirstName: apt.ownerFirstName || '',
      ownerLastName: apt.ownerLastName || '',
      phoneNumber: apt.phoneNumber || '',
      email: apt.email || '',
      shareAmount: apt.shareAmount || '',
      status: apt.status || '',
      collectionDate: apt.collectionDate || '',
      additionalInfo: apt.additionalInfo || ''
    }
  }
})

async function submit() {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  
  try {
    console.log('🔍 Apartament do edycji:', props.apartment)
    
    const source = props.apartment._source || props.apartment.source
    const ownerLogin = props.apartment._ownerLogin || props.apartment.ownerLogin
    const originalNumber = props.apartment._originalNumber || props.apartment.number
    const userId = props.apartment._userId || props.apartment.userId
    
    console.log('📝 Dane:', { source, ownerLogin, originalNumber, userId })
    
    let endpoint = ''
    let payload: any = {}
    
    if (source === 'public') {
      // Edycja publicznego wpisu
      const aptId = props.apartment._id || props.apartment.id
      if (!aptId) {
        throw new Error('Brak ID lokalu publicznego')
      }
      
      endpoint = `${API_URL}/public-apartments/${aptId}`
      payload = {
        apartmentNumber: form.value.apartmentNumber,
        ownerFirstName: form.value.ownerFirstName,
        ownerLastName: form.value.ownerLastName,
        phoneNumber: form.value.phoneNumber,
        email: form.value.email,
        shareAmount: form.value.shareAmount,
        status: form.value.status,
        collectionDate: form.value.collectionDate,
        additionalInfo: form.value.additionalInfo
      }
      
      console.log('📤 Publiczny endpoint:', endpoint)
    } else if (source === 'user') {
      // Edycja wpisu użytkownika (tylko admin)
      console.log('👤 Edycja lokalu użytkownika')
      console.log('🔐 Czy admin?', authStore.isAdmin)
      
      if (!authStore.isAdmin) {
        throw new Error('Tylko admin może edytować lokale użytkowników')
      }
      
      if (!userId) {
        console.error('❌ Brak userId w danych apartamentu:', props.apartment)
        throw new Error('Brak ID właściciela lokalu')
      }
      
      endpoint = `${API_URL}/statistics/apartments/user/${userId}/${encodeURIComponent(originalNumber)}`
      payload = {
        number: form.value.apartmentNumber,
        shareAmount: form.value.shareAmount,
        status: form.value.status,
        collectionDate: form.value.collectionDate,
        additionalInfo: form.value.additionalInfo
      }
      
      console.log('📤 User endpoint:', endpoint)
      console.log('📦 Payload:', payload)
    } else {
      throw new Error('Nieznane źródło danych: ' + source)
    }
    
    console.log('🚀 Wysyłam request...')
    const response = await axios.put(endpoint, payload)
    console.log('✅ Odpowiedź:', response.data)
    
    successMsg.value = 'Lokal zaktualizowany pomyślnie!'
    
    setTimeout(() => {
      emit('updated')
      emit('close')
    }, 1000)
  } catch (e: any) {
    console.error('❌ Błąd edycji:', e)
    console.error('❌ Response:', e.response?.data)
    errorMsg.value = e.message || e.response?.data?.error || 'Nie udało się zaktualizować lokalu.'
        // Obsługa rate limiting
    if (e.response?.status === 429) {
      errorMsg.value = '⏳ Zbyt wiele edycji. Spróbuj ponownie za 15 minut lub zaloguj się, aby uniknąć limitów.';
    } else {
      errorMsg.value = e.message || e.response?.data?.error || 'Nie udało się zaktualizować lokalu.';
    }
  } finally {
    loading.value = false
  }
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
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-card h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.admin-notice {
  background: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 14px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
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
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

@media (max-width: 480px) {
  .modal-card {
    padding: 20px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
