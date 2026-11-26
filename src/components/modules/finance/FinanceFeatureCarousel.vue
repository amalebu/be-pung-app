<script setup>
import { useRouter } from 'vue-router'
import {
  Percentage,
  StatsReport,
  PiggyBank,
  HandCash,
  ShoppingBag,
  GraphUp,
} from '@iconoir/vue'

const router = useRouter()

const featureItems = [
  {
    id: 'budget',
    name: 'Budgeting',
    icon: Percentage,
    path: '/finance/budgeting',
    hint: 'Batas Kategori',
  },
  {
    id: 'routine',
    name: 'Tagihan Rutin',
    icon: StatsReport,
    path: '/finance/budgeting',
    hint: 'Pengeluaran Rutin',
  },
  {
    id: 'savings',
    name: 'Tabungan',
    icon: PiggyBank,
    path: '/finance/savings',
    hint: 'Target & Celengan',
  },
  {
    id: 'debts',
    name: 'Utang Piutang',
    icon: HandCash,
    path: '/finance/debts',
    hint: 'Catatan Pinjaman',
  },
  {
    id: 'wishlist',
    name: 'To Buy List',
    icon: ShoppingBag,
    path: '/finance/wishlist',
    hint: 'Rencana Belanja',
  },
  {
    id: 'statistics',
    name: 'Statistik',
    icon: GraphUp,
    path: '/finance/statistics',
    hint: 'Analisis Arus Kas',
  },
]

function navigateTo(path) {
  router.push(path)
}
</script>

<template>
  <div class="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
    <button
      v-for="item in featureItems"
      :key="item.id"
      type="button"
      @click="navigateTo(item.path)"
      class="group p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-surface hover:border-[#144229]/40 dark:hover:border-zinc-700 active:scale-97 transition-all cursor-pointer flex flex-col items-center text-center focus:outline-none"
    >
      <div
        class="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#d3e4d8]/50 dark:bg-[#144229]/45 text-[#144229] dark:text-[#a1d2af] group-hover:bg-[#144229] group-hover:text-white dark:group-hover:bg-[#a1d2af] dark:group-hover:text-[#002110] transition-colors"
      >
        <component :is="item.icon" class="w-5 h-5 stroke-[2]" />
      </div>

      <span
        class="mt-2 text-xs font-bold text-slate-800 dark:text-zinc-200 tracking-tight truncate w-full"
      >
        {{ item.name }}
      </span>
      <span
        class="text-[10px] text-slate-400 dark:text-zinc-500 truncate w-full mt-0.5 hidden sm:block"
      >
        {{ item.hint }}
      </span>
    </button>
  </div>
</template>
