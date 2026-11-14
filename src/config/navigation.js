import { ViewGrid, Wallet, GraphUp, Spark, CheckSquare, OpenBook, Calendar, Check, List, CheckCircle, Camera } from '@iconoir/vue'

export const mainNavItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: ViewGrid,
    badge: null,
  },
  {
    name: 'Finance Tracker',
    path: '/dashboard',
    icon: Wallet,
    badge: 'Segera',
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

// Konfigurasi Submenu per Route Name
export const subnavConfig = {
  dashboard: [
    // Kosong: tombol '+' otomatis beralih ke FAB kanan bawah
  ],
  investments: [
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
      path: '/investments',
      query: { tab: 'sales' },
    },
    {
      id: 'investments-cash',
      name: 'Cash RDN',
      icon: Wallet,
      path: '/investments',
      query: { tab: 'cash' },
    },
  ],
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
