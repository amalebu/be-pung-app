<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const currentTab = computed(() => {
  if (route.path.startsWith('/finance/wallets') || route.name === 'finance-wallets') {
    return 'wallets'
  }
  if (route.path.startsWith('/finance/statistics') || route.name === 'finance-statistics') {
    return 'statistics'
  }
  if (route.path.startsWith('/finance/settings') || route.name === 'finance-settings') {
    return 'settings'
  }
  // Halaman utama maupun sub-fitur dari Ringkasan (budgeting, savings, debts, wishlist)
  return 'summary'
})

const tabs = [
  { id: 'summary', label: 'Ringkasan', path: '/finance' },
  { id: 'wallets', label: 'Dompet & Kartu', path: '/finance/wallets' },
  { id: 'statistics', label: 'Statistik', path: '/finance/statistics' },
  { id: 'settings', label: 'Pengaturan', path: '/finance/settings' },
]

function selectTab(tab) {
  if (route.path !== tab.path) {
    router.push(tab.path)
  }
}
</script>

<template>
  <div class="hidden md:flex items-center gap-8 border-b border-[#e2e2e5] dark:border-zinc-800 select-none">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      @click="selectTab(tab)"
      class="text-sm tracking-tight transition-all pb-3 relative -mb-px cursor-pointer inline-flex items-center gap-1.5 focus:outline-none"
      :class="
        currentTab === tab.id
          ? 'font-bold text-slate-900 dark:text-zinc-100 border-b-2 border-[#144229] dark:border-[#a1d2af]'
          : 'font-medium text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 border-b-2 border-transparent'
      "
    >
      <span>{{ tab.label }}</span>
    </button>
  </div>
</template>
