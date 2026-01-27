import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Calendar from '../views/Calendar.vue';
import Profile from '../views/Profile.vue';
import Permissions from '../views/Permissions.vue';
import ApartmentStatistics from '../views/ApartmentStatistics.vue';
import BackupView from '../views/BackupView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'ApartmentStatistics', // ZMIENIONO: Statystyki jako główna
    component: ApartmentStatistics,
    meta: { requiresAuth: false },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresGuest: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true },
  },
  {
    path: '/permissions',
    name: 'Permissions',
    component: Permissions,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/calendar',
    name: 'Calendar', // ZMIENIONO: Kalendarz jako podstrona
    component: Calendar,
    meta: { requiresAuth: false },
  },
  {
    path: '/backup',
    name: 'Backup',
    component: BackupView,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
  path: '/polls',
  name: 'Polls',
  component: () => import('../views/PollsView.vue')
  },
  {
  path: '/polls/:id',
  name: 'PollDetail',
  component: () => import('../views/PollDetailView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // POPRAWKA: Pobierz profil tylko jeśli token istnieje i strona wymaga autoryzacji
  if (authStore.token && !authStore.user && to.meta.requiresAuth) {
    try {
      await authStore.fetchProfile();
    } catch (error) {
      // Jeśli token jest nieprawidłowy, wyloguj użytkownika
      authStore.logout();
    }
  }

  // Wymagane logowanie
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/'); // ZMIENIONO: Przekierowanie na statystyki
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/'); // ZMIENIONO: Przekierowanie na statystyki
  } else {
    next();
  }
});

export default router;
