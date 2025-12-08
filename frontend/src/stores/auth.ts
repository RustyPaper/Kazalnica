import { defineStore } from 'pinia';
import axios from 'axios';
import { API_URL } from '../config';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    async login(credentials: { login: string; password: string }) {
      try {
        console.log('Logging in to:', API_URL);
        const response = await axios.post(`${API_URL}/auth/login`, credentials);
        
        this.token = response.data.token;
        this.user = response.data.user;
        this.isAuthenticated = true;
        
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        return { success: true };
      } catch (error: any) {
        console.error('Login error:', error);
        return { 
          success: false, 
          error: error.response?.data?.error || 'Błąd logowania' 
        };
      }
    },

    async register(userData: any) {
      try {
        const response = await axios.post(`${API_URL}/auth/register`, userData);
        
        this.token = response.data.token;
        this.user = response.data.user;
        this.isAuthenticated = true;
        
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        return { success: true };
      } catch (error: any) {
        console.error('Register error:', error);
        return { 
          success: false, 
          error: error.response?.data?.error || 'Błąd rejestracji' 
        };
      }
    },

    async fetchProfile() {
      try {
        const response = await axios.get(`${API_URL}/users/profile`);
        this.user = response.data;
        return { success: true };
      } catch (error: any) {
        console.error('Fetch profile error:', error);
        return { 
          success: false, 
          error: error.response?.data?.error || 'Błąd pobierania profilu' 
        };
      }
    },

    async updateProfile(userData: any) {
      try {
        const response = await axios.put(`${API_URL}/users/profile`, userData);
        this.user = response.data;
        return { success: true };
      } catch (error: any) {
        console.error('Update profile error:', error);
        return { 
          success: false, 
          error: error.response?.data?.error || 'Błąd aktualizacji profilu' 
        };
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    },

    async initializeAuth() {
      const token = localStorage.getItem('token');
      
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          const response = await axios.get(`${API_URL}/users/profile`);
          this.user = response.data;
          this.isAuthenticated = true;
          this.token = token;
        } catch (error) {
          console.error('Auth initialization failed:', error);
          this.logout();
        }
      }
    },

    hasPermission(permission: keyof User['permissions']): boolean {
      if (!this.user) return false;
      if (this.user.role === 'admin') return true;
      return this.user.permissions[permission] === true;
    },
  },
});
