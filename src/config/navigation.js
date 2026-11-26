import { ViewGrid, Wallet, GraphUp, Spark, CheckSquare, OpenBook, Calendar, Check, List, CheckCircle, Camera, Settings } from '@iconoir/vue'

export const mainNavItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: ViewGrid,
    badge: null,
  },
  {
    name: 'Finance Tracker',
    path: '/finance',
    icon: Wallet,
    badge: null,
  },
  {
    name: 'Investment',
    path: '/investments',
    icon: GraphUp,
    badge: null,
  },
  {
    name: 'Habit Tracker',
    path: '/habits',
    icon: Spark,
    badge: null,
  },
  {
    name: 'To-Do List',
    path: '/todos',
    icon: CheckSquare,
    badge: null,
  },
  {
    name: 'PhotoMarker',
    path: '/photomarker',
    icon: Camera,
    badge: null,
  },
]

const financeSubnav = [
  { id: 'finance-summary', name: 'Ringkasan', icon: ViewGrid, path: '/finance' },
  { id: 'finance-wallets', name: 'Dompet & Kartu', icon: Wallet, path: '/finance/wallets' },
  { id: 'finance-statistics', name: 'Statistik', icon: GraphUp, path: '/finance/statistics' },
  { id: 'finance-settings', name: 'Pengaturan', icon: Settings, path: '/finance/settings' },
]

const investmentsSubnav = [
  {
    id: 'investments-holdings',
    name: 'Portofolio Saham',
    icon: GraphUp,
    path: '/investments',
  },
  {
    id: 'investments-sales',
    name: 'Realized P/L',
    icon: CheckCircle,
    path: '/investments/history',
  },
  {
    id: 'investments-cash',
    name: 'Cash RDN',
    icon: Wallet,
    path: '/investments/cash',
  },
]

// Konfigurasi Submenu per Route Name
export const subnavConfig = {
  dashboard: [
    // Kosong: tombol '+' otomatis beralih ke FAB kanan bawah
  ],
  'finance-summary': financeSubnav,
  'finance-wallets': financeSubnav,
  'finance-statistics': financeSubnav,
  'finance-settings': financeSubnav,
  'finance-budgeting': financeSubnav,
  'finance-savings': financeSubnav,
  'finance-debts': financeSubnav,
  'finance-wishlist': financeSubnav,
  investments: investmentsSubnav,
  'investments-history': investmentsSubnav,
  'investments-cash': investmentsSubnav,
  habits: [
    {
      id: 'habits-list',
      name: 'Daftar Kebiasaan',
      icon: Spark,
      path: '/habits',
    },
    {
      id: 'habits-journal',
      name: 'Jurnal Harian',
      icon: OpenBook,
      path: '/habits',
      query: { tab: 'journal' },
    },
  ],
  todos: [
    {
      id: 'todos-all',
      name: 'Semua Tugas',
      icon: List,
      path: '/todos',
    },
    {
      id: 'todos-today',
      name: 'Hari Ini',
      icon: Calendar,
      path: '/todos',
      query: { filter: 'today' },
    },
    {
      id: 'todos-completed',
      name: 'Selesai',
      icon: Check,
      path: '/todos',
      query: { filter: 'completed' },
    },
  ],
}

/**
 * Mengambil daftar submenu berdasarkan objek route vue-router saat ini
 */
export function getSubnavForRoute(route) {
  if (!route || !route.name) return []
  return subnavConfig[route.name] || []
}

/**
 * Menentukan apakah item submenu sedang aktif (memeriksa path dan query params)
 */
export function isSubnavItemActive(item, route) {
  if (!route) return false
  if (route.path !== item.path) return false

  // Jika item memiliki requirement query (misal ?tab=journal)
  if (item.query && Object.keys(item.query).length > 0) {
    return Object.entries(item.query).every(([k, v]) => route.query[k] === v)
  }

  // Jika item tidak mendefinisikan query spesifik, item aktif jika tidak ada query penentu
  const routeHasFilterQuery = Object.keys(route.query || {}).some((k) =>
    ['tab', 'filter'].includes(k)
  )
  return !routeHasFilterQuery
}
