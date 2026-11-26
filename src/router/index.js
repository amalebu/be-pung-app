import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import LoginView from '@/views/auth/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import TodoView from '@/views/todos/TodoView.vue'
import HabitView from '@/views/habits/HabitView.vue'
import ProfileView from '@/views/profile/ProfileView.vue'
import SettingsView from '@/views/settings/SettingsView.vue'
import PhotoMarkerView from '@/views/photos/PhotoMarkerView.vue'

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
    redirect: '/dashboard',
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
    path: '/finance',
    component: () => import('@/views/finance/FinanceLayout.vue'),
    meta: { requiresAuth: true, menuKey: 'finance' },
    children: [
      {
        path: '',
        name: 'finance-summary',
        component: () => import('@/views/finance/FinanceSummaryView.vue'),
        meta: { requiresAuth: true, menuKey: 'finance' },
      },
      {
        path: 'wallets',
        name: 'finance-wallets',
        component: () => import('@/views/finance/FinanceWalletsView.vue'),
        meta: { requiresAuth: true, menuKey: 'finance' },
      },
      {
        path: 'budgeting',
        name: 'finance-budgeting',
        component: () => import('@/views/finance/FinanceBudgetingView.vue'),
        meta: { requiresAuth: true, menuKey: 'finance' },
      },
      {
        path: 'statistics',
        name: 'finance-statistics',
        component: () => import('@/views/finance/FinanceStatisticsView.vue'),
        meta: { requiresAuth: true, menuKey: 'finance' },
      },
      {
        path: 'settings',
        name: 'finance-settings',
        component: () => import('@/views/finance/FinanceSettingsView.vue'),
        meta: { requiresAuth: true, menuKey: 'finance' },
      },
      {
        path: 'savings',
        name: 'finance-savings',
        component: () => import('@/views/finance/FinanceSavingsView.vue'),
        meta: { requiresAuth: true, menuKey: 'finance' },
      },
      {
        path: 'debts',
        name: 'finance-debts',
        component: () => import('@/views/finance/FinanceDebtsView.vue'),
        meta: { requiresAuth: true, menuKey: 'finance' },
      },
      {
        path: 'wishlist',
        name: 'finance-wishlist',
        component: () => import('@/views/finance/FinanceWishlistView.vue'),
        meta: { requiresAuth: true, menuKey: 'finance' },
      },
    ],
  },
  {
    path: '/investments',
    component: () => import('@/views/investments/InvestmentLayout.vue'),
    meta: { requiresAuth: true, menuKey: 'investments' },
    children: [
      {
        path: '',
        name: 'investments',
        component: () => import('@/views/investments/InvestmentHoldingsView.vue'),
        meta: { requiresAuth: true, menuKey: 'investments' },
        beforeEnter: (to) => {
          if (to.query.tab === 'sales') {
            return { path: '/investments/history' }
          }
          if (to.query.tab === 'summary') {
            return { path: '/investments/history', query: { tab: 'summary' } }
          }
          if (to.query.tab === 'cash') {
            return { path: '/investments/cash' }
          }
          return true
        },
      },
      {
        path: 'history',
        name: 'investments-history',
        component: () => import('@/views/investments/InvestmentHistoryView.vue'),
        meta: { requiresAuth: true, menuKey: 'investments' },
        beforeEnter: (to) => {
          if (to.query.tab === 'cash') {
            return { path: '/investments/cash' }
          }
          return true
        },
      },
      {
        path: 'cash',
        name: 'investments-cash',
        component: () => import('@/views/investments/InvestmentCashView.vue'),
        meta: { requiresAuth: true, menuKey: 'investments' },
      },
    ],
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
    path: '/photomarker',
    name: 'photomarker',
    component: PhotoMarkerView,
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
    return { name: 'dashboard' }
  }

  return true
})

export default router
