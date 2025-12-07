import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Calendar from '../views/Calendar.vue';
import Profile from '../views/Profile.vue';
import Permissions from '../views/Permissions.vue';
import ApartmentStatistics from '../views/ApartmentStatistics.vue';

const routes = [
  {
    path: '/',
    redirect: '/login',
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
    path: '/calendar',
    name: 'Calendar',
    component: Calendar,
    meta: { requiresAuth: true },
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
    path: '/statistics',
    name: 'ApartmentStatistics',
    component: ApartmentStatistics,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (authStore.token && !authStore.user) {
    await authStore.fetchProfile();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/calendar');
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/calendar');
  } else {
    next();
  }
});

export default router;
