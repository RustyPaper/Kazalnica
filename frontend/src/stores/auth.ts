import { defineStore } from 'pinia';
import axios from 'axios';
import type { User, LoginCredentials, RegisterData } from '../types';
import { API_URL } from '../config'; // ← MUSI BYĆ

// NIE MOŻE BYĆ:
// const API_URL = 'http://localhost:3000/api';
console.log('🔐 Auth store initialized with API_URL:', API_URL);

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('token') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    hasPermission: (state) => (permission: keyof User['permissions']) => {
      return state.user?.permissions[permission] || state.user?.role === 'admin';
    },
  },

  actions: {
    setAuthHeader() {
      if (this.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      } else {
        delete axios.defaults.headers.common['Authorization'];
      }
    },

    async login(credentials: LoginCredentials) {
      try {
        console.log('Logging in to:', API_URL); // ← DEBUG
        const response = await axios.post(`${API_URL}/auth/login`, credentials, {
          withCredentials: true // ← WAŻNE dla CORS
        });
        this.token = response.data.token;
        this.user = response.data.user;
        localStorage.setItem('token', this.token!);
        this.setAuthHeader();
        return { success: true };
      } catch (error: any) {
        console.error('Login error:', error); // ← DEBUG
        return {
          success: false,
          error: error.response?.data?.error || 'Błąd logowania',
        };
      }
    },

    async register(data: RegisterData) {
      try {
        const response = await axios.post(`${API_URL}/auth/register`, data, {
          withCredentials: true
        });
        this.token = response.data.token;
        this.user = response.data.user;
        localStorage.setItem('token', this.token!);
        this.setAuthHeader();
        return { success: true };
      } catch (error: any) {
        return {
          success: false,
          error: error.response?.data?.error || 'Błąd rejestracji',
        };
      }
    },

    async fetchProfile() {
      try {
        this.setAuthHeader();
        const response = await axios.get(`${API_URL}/users/profile`, {
          withCredentials: true
        });
        this.user = response.data;
      } catch (error) {
        this.logout();
      }
    },

    async updateProfile(data: Partial<User>) {
      try {
        const response = await axios.put(`${API_URL}/users/profile`, data, {
          withCredentials: true
        });
        this.user = response.data;
        return { success: true };
      } catch (error: any) {
        return {
          success: false,
          error: error.response?.data?.error || 'Błąd aktualizacji profilu',
        };
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    },
  },
});
