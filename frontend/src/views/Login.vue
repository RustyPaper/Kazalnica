<template>
  <div class="container login-container">
    <div class="card login-card">
      <div class="login-header">
        <h2>🔐 Logowanie</h2>
        <p>Witaj ponownie!</p>
      </div>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>
            Login <span class="required">*</span>
          </label>
          <input 
            type="text" 
            v-model="credentials.login" 
            required 
            placeholder="Wprowadź login"
            autocomplete="username"
          />
        </div>
        
        <div class="form-group">
          <label>
            Hasło <span class="required">*</span>
          </label>
          <input 
            type="password" 
            v-model="credentials.password" 
            required 
            placeholder="Wprowadź hasło"
            autocomplete="current-password"
          />
        </div>
        
        <div class="error" v-if="error">{{ error }}</div>
        
        <button type="submit" class="btn btn-primary btn-block">
          Zaloguj się
        </button>
      </form>
      
      <div class="login-footer">
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

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 100px);
  padding: 20px;
}

.login-card {
  max-width: 400px;
  width: 100%;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  margin-bottom: 10px;
  font-size: 28px;
}

.login-header p {
  color: #666;
  font-size: 14px;
}

.btn-block {
  width: 100%;
  margin-top: 10px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

@media (max-width: 480px) {
  .login-header h2 {
    font-size: 24px;
  }

  .login-card {
    padding: 20px 15px;
  }
}
</style>

