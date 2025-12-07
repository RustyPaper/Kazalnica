<template>
  <div id="app">
    <nav class="navbar" v-if="authStore.isAuthenticated">
      <div class="navbar-content">
        <div class="navbar-title">Kalendarz Apartamentów</div>
        <ul class="navbar-menu">
          <li>
            <router-link to="/calendar" :class="{ active: $route.path === '/calendar' }">
              Kalendarz
            </router-link>
          </li>
          <li>
            <router-link to="/statistics" :class="{ active: $route.path === '/statistics' }">
              Statystyki
            </router-link>
          </li>
          <li>
            <router-link to="/profile" :class="{ active: $route.path === '/profile' }">
              Profil
            </router-link>
          </li>
          <li v-if="authStore.isAdmin">
            <router-link to="/permissions" :class="{ active: $route.path === '/permissions' }">
              Uprawnienia
            </router-link>
          </li>
          <li>
            <a href="#" @click.prevent="logout">Wyloguj</a>
          </li>
        </ul>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from './stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>
