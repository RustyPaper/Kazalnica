<template>
  <div class="container">
    <div class="card">
      <h2 style="margin-bottom: 20px;">Zarządzanie uprawnieniami</h2>
      
      <div v-if="loading" style="text-align: center; padding: 20px;">
        Ładowanie...
      </div>
      
      <div v-else>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Login</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Imię i nazwisko</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Rola</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Akcje</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px;">{{ user.login }}</td>
              <td style="padding: 10px;">{{ user.firstName }} {{ user.lastName }}</td>
              <td style="padding: 10px;">
                <span :class="user.role === 'admin' ? 'badge-admin' : 'badge-user'">
                  {{ user.role === 'admin' ? 'Administrator' : 'Użytkownik' }}
                </span>
              </td>
              <td style="padding: 10px;">
                <button
                  class="btn btn-primary"
                  @click="openPermissionsModal(user)"
                  :disabled="user.id === authStore.user?.id"
                >
                  Edytuj uprawnienia
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Permissions Modal -->
    <div v-if="selectedUser" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Uprawnienia: {{ selectedUser.login }}</h3>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        
        <div class="form-group">
          <label>
            <input
              type="checkbox"
              v-model="editPermissions.viewCalendar"
              :disabled="selectedUser.role === 'admin'"
            />
            Podgląd kalendarza
          </label>
        </div>
        
        <div class="form-group">
          <label>
            <input
              type="checkbox"
              v-model="editPermissions.addEvent"
              :disabled="selectedUser.role === 'admin'"
            />
            Dodawanie wydarzeń
          </label>
        </div>
        
        <div class="form-group">
          <label>
            <input
              type="checkbox"
              v-model="editPermissions.deleteEvent"
              :disabled="selectedUser.role === 'admin'"
            />
            Usuwanie wydarzeń
          </label>
        </div>
        
        <div v-if="selectedUser.role === 'admin'" style="color: #666; font-size: 14px; margin-bottom: 15px;">
          Administrator ma wszystkie uprawnienia
        </div>
        
        <div class="error" v-if="error">{{ error }}</div>
        <div class="success" v-if="success">{{ success }}</div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button class="btn btn-primary" @click="savePermissions" :disabled="selectedUser.role === 'admin'">
            Zapisz
          </button>
          <button class="btn btn-secondary" @click="closeModal">
            Anuluj
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import type { User } from '../types';
import { API_URL } from '../config';

const authStore = useAuthStore();
//const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const users = ref<User[]>([]);
const selectedUser = ref<User | null>(null);
const editPermissions = ref({
  viewCalendar: false,
  addEvent: false,
  deleteEvent: false,
});

const loading = ref(true);
const error = ref('');
const success = ref('');

const fetchUsers = async () => {
  try {
    loading.value = true;
    const response = await axios.get(`${API_URL}/users/all`);
    users.value = response.data;
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Błąd pobierania użytkowników';
  } finally {
    loading.value = false;
  }
};

const openPermissionsModal = (user: User) => {
  selectedUser.value = user;
  editPermissions.value = { ...user.permissions };
  error.value = '';
  success.value = '';
};

const closeModal = () => {
  selectedUser.value = null;
  error.value = '';
  success.value = '';
};

const savePermissions = async () => {
  if (!selectedUser.value) return;
  
  try {
    error.value = '';
    success.value = '';
    
    const response = await axios.put(
      `${API_URL}/permissions/${selectedUser.value.id}`,
      { permissions: editPermissions.value }
    );
    
    // Update user in list
    const userIndex = users.value.findIndex(u => u.id === selectedUser.value!.id);
    if (userIndex !== -1) {
      users.value[userIndex] = response.data;
    }
    
    success.value = 'Uprawnienia zostały zaktualizowane';
    
    setTimeout(() => {
      closeModal();
    }, 1500);
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Błąd aktualizacji uprawnień';
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.badge-admin {
  background-color: #dc3545;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.badge-user {
  background-color: #28a745;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-group input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}
</style>
