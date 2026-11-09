import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import LoginView from '@/views/auth/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import TodoView from '@/views/todos/TodoView.vue'
import HabitView from '@/views/habits/HabitView.vue'
import InvestmentView from '@/views/investments/InvestmentView.vue'
import ProfileView from '@/views/profile/ProfileView.vue'
import SettingsView from '@/views/settings/SettingsView.vue'
import VerifyPinView from '@/views/auth/VerifyPinView.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/verify-pin',
    name: 'verify-pin',
    component: VerifyPinView,
    meta: { requiresAuth: true, isPinRoute: true },
  },
  {
    path: '/register',
    redirect: '/login',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/investments',
    name: 'investments',
    component: InvestmentView,
    meta: { requiresAuth: true },
  },
  {
    path: '/todos',
    name: 'todos',
    component: TodoView,
    meta: { requiresAuth: true },
  },
  {
    path: '/habits',
    name: 'habits',
    component: HabitView,
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  authStore.checkInactivityLock()

  // 1. Jika rute butuh login, tapi user belum terautentikasi
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  // 2. Jika user sudah login dan mengakses halaman guest (seperti /login)
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    if (authStore.isPinLocked || authStore.needsPinSetup) {
      return { name: 'verify-pin' }
    }
    return { name: 'dashboard' }
  }

  // 3. Jika user sudah login dan layar terkunci PIN (atau belum setup PIN)
  if (authStore.isAuthenticated && (authStore.isPinLocked || authStore.needsPinSetup)) {
    if (to.name === 'verify-pin') {
      return true
    }
    return {
      name: 'verify-pin',
      query: { redirect: to.fullPath },
    }
  }

  // 4. Jika user sudah login dan TIDAK terkunci, cegah akses manual ke /verify-pin
  if (authStore.isAuthenticated && !authStore.isPinLocked && !authStore.needsPinSetup && to.name === 'verify-pin') {
    const target = to.query.redirect
    if (target && typeof target === 'string' && target.startsWith('/') && target !== '/verify-pin') {
      return target
    }
    return { name: 'dashboard' }
  }

  return true
})

export default router
