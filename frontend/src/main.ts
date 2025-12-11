import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/auth'
import axios from 'axios'
import './style.css'

// Axios interceptor - zawsze dodawaj token z localStorage
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📤 Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - obsługa błędów
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('📥 Response error:', error.response?.status, error.config?.url);
    
    // POPRAWKA: Nie przekierowuj automatycznie na /login dla publicznych stron
    if (error.response?.status === 401) {
      console.warn('🚫 401 Unauthorized - clearing auth');
      localStorage.removeItem('token');
      
      // Sprawdź czy jesteś na stronie wymagającej autoryzacji
      const currentPath = window.location.pathname;
      const publicPaths = ['/', '/login', '/register', '/statistics'];
      
      if (!publicPaths.includes(currentPath)) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// NOWE: Inicjalizacja autoryzacji po załadowaniu Pinia
const authStore = useAuthStore()
authStore.initializeAuth()

app.mount('#app')
