<template>
  <div class="container">
    <div class="card">
      <h2 style="margin-bottom: 20px;">Profil użytkownika</h2>
      
      <form @submit.prevent="handleUpdate">
        <div class="form-group">
          <label>Login</label>
          <input type="text" :value="authStore.user?.login" disabled />
          <small style="color: #666;">Login nie może być zmieniony</small>
        </div>
        
        <div class="form-group">
          <label>
            Imię <span class="required">*</span>
          </label>
          <input type="text" v-model="formData.firstName" required />
        </div>
        
        <div class="form-group">
          <label>Nazwisko</label>
          <input type="text" v-model="formData.lastName" />
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="margin-bottom: 10px;">Lokale</h3>
          <div v-for="(apartment, index) in formData.apartments" :key="index" class="card" style="margin-bottom: 10px;">
            <div class="form-group">
              <label>
                Numer lokalu {{ index + 1 }} <span class="required">*</span>
              </label>
              <input type="text" v-model="apartment.number" required />
            </div>
            
            <div class="form-group">
              <label>Wysokość udziałów w częściach wspólnych lokalu {{ index + 1 }} (Znajduje się w Akcie notarnialnym w &1 pkt 1)</label>
              <input type="text" v-model="apartment.shareAmount" placeholder="np. 250.50" />
            </div>
            
            <div class="form-group">
              <label>Status lokalu {{ index + 1 }}</label>
              <select v-model="apartment.status">
                <option :value="undefined">Nie wybrano</option>
                <option value="lease_agreement">Umowa dzierżawy</option>
                <option value="notice_sent">Wysłane wezwanie</option>
                <option value="collection_date">Odbieram w dniu</option>
                <option value="collected">Odebrane</option>
              </select>
            </div>
            
            <div class="form-group" v-if="apartment.status === 'collection_date'">
              <label>Data odbioru lokalu {{ index + 1 }}</label>
              <input type="date" v-model="apartment.collectionDate" />
            </div>
            
            <div class="form-group">
              <label>Dodatkowe informacje dla lokalu {{ index + 1 }}</label>
              <textarea v-model="apartment.additionalInfo" rows="3"></textarea>
            </div>
            
            <button
              v-if="formData.apartments.length > 1"
              type="button"
              class="btn btn-danger"
              @click="removeApartment(index)"
            >
              Usuń lokal
            </button>
          </div>
          
          <button type="button" class="btn btn-secondary" @click="addApartment">
            Dodaj kolejny lokal
          </button>
        </div>
        
        <div class="form-group">
          <label>Numer telefonu</label>
          <input type="tel" v-model="formData.phoneNumber" />
        </div>
        
        <div class="form-group">
          <label>E-mail</label>
          <input type="email" v-model="formData.email" />
        </div>
        
        <div class="form-group">
          <label>Nowe hasło</label>
          <input type="password" v-model="formData.password" />
          <small style="color: #666;">Pozostaw puste, jeśli nie chcesz zmieniać hasła</small>
        </div>
        
        <div class="success" v-if="success">{{ success }}</div>
        <div class="error" v-if="error">{{ error }}</div>
        
        <button type="submit" class="btn btn-primary" style="margin-top: 10px;">
          Zapisz zmiany
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import type { Apartment } from '../types';

const authStore = useAuthStore();

const formData = ref({
  firstName: '',
  lastName: '',
  apartments: [] as Apartment[],
  phoneNumber: '',
  email: '',
  password: '',
});

const error = ref('');
const success = ref('');

onMounted(() => {
  if (authStore.user) {
    formData.value = {
      firstName: authStore.user.firstName,
      lastName: authStore.user.lastName || '',
      apartments: JSON.parse(JSON.stringify(authStore.user.apartments)),
      phoneNumber: authStore.user.phoneNumber || '',
      email: authStore.user.email || '',
      password: '',
    };
  }
});

const addApartment = () => {
  formData.value.apartments.push({
    number: '',
    shareAmount: '',
    additionalInfo: '',
    status: undefined,
    collectionDate: ''
  });
};

const removeApartment = (index: number) => {
  formData.value.apartments.splice(index, 1);
};

const handleUpdate = async () => {
  error.value = '';
  success.value = '';
  
  const validApartments = formData.value.apartments.filter(apt => apt.number.trim() !== '');
  
  if (validApartments.length === 0) {
    error.value = 'Musisz podać przynajmniej jeden numer lokalu';
    return;
  }
  
  const updateData: any = {
    firstName: formData.value.firstName,
        lastName: formData.value.lastName,
    apartments: validApartments,
    phoneNumber: formData.value.phoneNumber,
    email: formData.value.email,
  };
  
  if (formData.value.password) {
    updateData.password = formData.value.password;
  }
  
  const result = await authStore.updateProfile(updateData);
  
  if (result.success) {
    success.value = 'Profil został zaktualizowany';
    formData.value.password = '';
  } else {
    error.value = result.error || 'Błąd aktualizacji profilu';
  }
};
</script>

