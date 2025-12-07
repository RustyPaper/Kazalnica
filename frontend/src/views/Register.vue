<template>
  <div class="container">
    <div class="card" style="max-width: 600px; margin: 50px auto;">
      <h2 style="margin-bottom: 20px;">Rejestracja</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>
            Login <span class="required">*</span>
          </label>
          <input type="text" v-model="formData.login" required />
        </div>
        
        <div class="form-group">
          <label>
            Hasło <span class="required">*</span>
          </label>
          <input type="password" v-model="formData.password" required />
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
              <label>Wysokość udziałów w częściach wspólnych lokalu {{ index + 1 }}</label>
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
        
        <div class="error" v-if="error">{{ error }}</div>
        
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
          Zarejestruj się
        </button>
      </form>
      
      <div style="text-align: center; margin-top: 20px;">
        <router-link to="/login">Masz już konto? Zaloguj się</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import type { Apartment } from '../types';

const router = useRouter();
const authStore = useAuthStore();

const formData = ref({
  login: '',
  password: '',
  firstName: '',
  lastName: '',
  apartments: [
    { number: '', shareAmount: '', additionalInfo: '', status: undefined, collectionDate: '' }
  ] as Apartment[],
  phoneNumber: '',
  email: '',
});

const error = ref('');

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

const handleRegister = async () => {
  error.value = '';
  
  const validApartments = formData.value.apartments.filter(apt => apt.number.trim() !== '');
  
  if (validApartments.length === 0) {
    error.value = 'Musisz podać przynajmniej jeden numer lokalu';
    return;
  }
  
  const result = await authStore.register({
    ...formData.value,
    apartments: validApartments
  });
  
  if (result.success) {
    router.push('/calendar');
  } else {
    error.value = result.error || 'Błąd rejestracji';
  }
};
</script>
