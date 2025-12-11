<template>
  <div id="app">
    <nav class="navbar">
      <div class="navbar-content">
        <div class="navbar-title">Kalendarz Apartamentów</div>
        
        <!-- Hamburger button (mobile) -->
        <button class="hamburger" @click="toggleMenu" :class="{ active: menuOpen }">
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <!-- Menu -->
        <ul class="navbar-menu" :class="{ open: menuOpen }">
          <li>
            <router-link to="/" :class="{ active: $route.path === '/' }" @click="closeMenu">
              📅 Kalendarz
            </router-link>
          </li>
          <li>
            <router-link to="/statistics" :class="{ active: $route.path === '/statistics' }" @click="closeMenu">
              📊 Statystyki
            </router-link>
          </li>
          
          <!-- Dla niezalogowanych użytkowników -->
          <template v-if="!authStore.isAuthenticated">
            <li>
              <router-link to="/login" :class="{ active: $route.path === '/login' }" @click="closeMenu" class="btn-login">
                🔑 Zaloguj
              </router-link>
            </li>
            <li>
              <router-link to="/register" :class="{ active: $route.path === '/register' }" @click="closeMenu">
                ✍️ Zarejestruj
              </router-link>
            </li>
          </template>
          
          <!-- Dla zalogowanych użytkowników -->
          <template v-else>
            <li>
              <router-link to="/profile" :class="{ active: $route.path === '/profile' }" @click="closeMenu">
                👤 Profil
              </router-link>
            </li>
            <li v-if="authStore.isAdmin">
              <router-link to="/permissions" :class="{ active: $route.path === '/permissions' }" @click="closeMenu">
                🔐 Uprawnienia
              </router-link>
            </li>
            <li>
              <a href="#" @click.prevent="logout">🚪 Wyloguj</a>
            </li>
          </template>
        </ul>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from './stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const menuOpen = ref(false);

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const closeMenu = () => {
  menuOpen.value = false;
};

const logout = () => {
  authStore.logout();
  router.push('/');
  closeMenu();
};
</script>

<style scoped>
.navbar {
  background-color: #343a40;
  color: white;
  padding: 15px 0;
  margin-bottom: 20px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.navbar-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-title {
  font-size: 20px;
  font-weight: bold;
}

/* Hamburger menu */
.hamburger {
  display: none;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
}

.hamburger span {
  width: 25px;
  height: 3px;
  background-color: white;
  margin: 3px 0;
  transition: 0.3s;
  border-radius: 3px;
}

.hamburger.active span:nth-child(1) {
  transform: rotate(-45deg) translate(-5px, 6px);
}

.hamburger.active span:nth-child(2) {
  opacity: 0;
}

.hamburger.active span:nth-child(3) {
  transform: rotate(45deg) translate(-5px, -6px);
}

.navbar-menu {
  display: flex;
  gap: 15px;
  list-style: none;
}

.navbar-menu a {
  color: white;
  text-decoration: none;
  padding: 8px 15px;
  border-radius: 4px;
  transition: background-color 0.2s;
  white-space: nowrap;
  display: block;
}

.navbar-menu a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.navbar-menu a.active {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Wyróżnienie przycisku logowania */
.btn-login {
  background-color: #28a745 !important;
  font-weight: 600;
}

.btn-login:hover {
  background-color: #218838 !important;
}

/* Mobile styles */
@media (max-width: 768px) {
  .hamburger {
    display: flex;
  }

  .navbar-title {
    font-size: 16px;
  }

  .navbar-menu {
    position: fixed;
    top: 61px;
    right: -100%;
    width: 250px;
    height: calc(100vh - 61px);
    background-color: #343a40;
    flex-direction: column;
    gap: 0;
    padding: 20px 0;
    transition: right 0.3s ease;
    box-shadow: -2px 0 5px rgba(0,0,0,0.2);
  }

  .navbar-menu.open {
    right: 0;
  }

  .navbar-menu li {
    width: 100%;
  }

  .navbar-menu a {
    padding: 15px 20px;
    border-radius: 0;
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .navbar-content {
    padding: 0 15px;
  }

  .navbar-title {
    font-size: 14px;
  }

  .navbar-menu {
    width: 200px;
  }
}
</style>
