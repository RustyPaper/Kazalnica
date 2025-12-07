<template>
  <div class="container">
    <div class="card" style="max-width: 400px; margin: 100px auto;">
      <h2 style="margin-bottom: 20px;">Logowanie</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>
            Login <span class="required">*</span>
          </label>
          <input type="text" v-model="credentials.login" required />
        </div>
        <div class="form-group">
          <label>
            Hasło <span class="required">*</span>
          </label>
          <input type="password" v-model="credentials.password" required />
        </div>
        <div class="error" v-if="error">{{ error }}</div>
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
          Zaloguj się
        </button>
      </form>
      <div style="text-align: center; margin-top: 20px;">
        <router-link to="/register">Nie masz konta? Zarejestruj się</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const credentials = ref({
  login: '',
  password: '',
});

const error = ref('');

const handleLogin = async () => {
  error.value = '';
  const result = await authStore.login(credentials.value);
  
  if (result.success) {
    router.push('/calendar');
  } else {
    error.value = result.error || 'Błąd logowania';
  }
};
</script>
