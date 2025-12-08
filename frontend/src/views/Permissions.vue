<template>
  <div class="container">
    <div class="card">
      <h2 style="margin-bottom: 20px;">Zarządzanie uprawnieniami</h2>
      
      <div v-if="loading" style="text-align: center; padding: 20px;">
        Ładowanie...
      </div>
      
      <div v-else>
        <div class="table-container">
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
                <td data-label="Login" style="padding: 10px;">{{ user.login }}</td>
                <td data-label="Imię i nazwisko" style="padding: 10px;">{{ user.firstName }} {{ user.lastName }}</td>
                <td data-label="Rola" style="padding: 10px;">
                  <span :class="user.role === 'admin' ? 'badge-admin' : 'badge-user'">
                    {{ user.role === 'admin' ? 'Administrator' : 'Użytkownik' }}
                  </span>
                </td>
                <td data-label="Akcje" style="padding: 10px;">
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button
                      class="btn btn-primary"
                      @click="openPermissionsModal(user)"
                      :disabled="user.id === authStore.user?.id"
                    >
                      Edytuj uprawnienia
                    </button>
                    <button
                      class="btn btn-danger"
                      @click="openDeleteModal(user)"
                      :disabled="user.id === authStore.user?.id"
                    >
                      Usuń konto
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Permissions Modal -->
    <div v-if="selectedUser && !showDeleteConfirm" class="modal-overlay" @click.self="closeModal">
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

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm && userToDelete" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Potwierdź usunięcie</h3>
          <button class="modal-close" @click="closeDeleteModal">&times;</button>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="font-size: 16px; margin-bottom: 10px;">
            Czy na pewno chcesz usunąć konto użytkownika <strong>{{ userToDelete.login }}</strong>?
          </p>
          <p style="color: #dc3545; font-size: 14px;">
            Ta operacja jest nieodwracalna!
          </p>
        </div>
        
        <div class="error" v-if="error">{{ error }}</div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button class="btn btn-danger" @click="confirmDelete" :disabled="deleting">
            {{ deleting ? 'Usuwanie...' : 'Tak' }}
          </button>
          <button class="btn btn-secondary" @click="closeDeleteModal" :disabled="deleting">
            Nie
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

const users = ref<User[]>([]);
const selectedUser = ref<User | null>(null);
const userToDelete = ref<User | null>(null);
const editPermissions = ref({
  viewCalendar: false,
  addEvent: false,
  deleteEvent: false,
});

const loading = ref(true);
const error = ref('');
const success = ref('');
const showDeleteConfirm = ref(false);
const deleting = ref(false);

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

const openDeleteModal = (user: User) => {
  userToDelete.value = user;
  showDeleteConfirm.value = true;
  error.value = '';
};

const closeDeleteModal = () => {
  userToDelete.value = null;
  showDeleteConfirm.value = false;
  error.value = '';
};

const confirmDelete = async () => {
  if (!userToDelete.value) return;
  
  try {
    deleting.value = true;
    error.value = '';
    
    await axios.delete(`${API_URL}/users/${userToDelete.value.id}`);
    
    // Remove user from list
    users.value = users.value.filter(u => u.id !== userToDelete.value!.id);
    
    closeDeleteModal();
    
    // Show success message
    success.value = `Użytkownik ${userToDelete.value.login} został usunięty`;
    setTimeout(() => {
      success.value = '';
    }, 3000);
    
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Błąd usuwania użytkownika';
  } finally {
    deleting.value = false;
  }
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
  display: inline-block;
}

.badge-user {
  background-color: #28a745;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
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

.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Mobile responsive */
@media (max-width: 768px) {
  table {
    font-size: 14px;
  }

  th, td {
    padding: 8px 6px !important;
  }

  .btn {
    padding: 6px 10px;
    font-size: 12px;
  }

  .badge-admin,
  .badge-user {
    font-size: 11px;
    padding: 3px 6px;
  }
}

@media (max-width: 640px) {
  /* Stack table on mobile */
  table, thead, tbody, th, td, tr {
    display: block;
  }

  thead tr {
    position: absolute;
    top: -9999px;
    left: -9999px;
  }

  tr {
    margin-bottom: 15px;
    border: 1px solid #ddd !important;
    border-radius: 8px;
    padding: 10px;
    background-color: #fff;
  }

  td {
    border: none !important;
    position: relative;
    padding-left: 45% !important;
    padding-right: 10px !important;
    text-align: right !important;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  td:before {
    position: absolute;
    left: 10px;
    width: 40%;
    padding-right: 10px;
    white-space: nowrap;
    text-align: left;
    font-weight: bold;
    content: attr(data-label);
    color: #666;
    font-size: 13px;
  }

  td[style*="padding: 10px;"] {
    padding: 10px 10px 10px 45% !important;
  }

  td div {
    width: 100%;
    flex-direction: column;
  }

  td .btn {
    width: 100%;
    margin-bottom: 5px;
  }

  .badge-admin,
  .badge-user {
    display: inline-block;
  }
}

@media (max-width: 480px) {
  h2 {
    font-size: 18px !important;
  }

  .modal {
    padding: 15px;
  }

  .modal-title {
    font-size: 16px;
  }
}
</style>
