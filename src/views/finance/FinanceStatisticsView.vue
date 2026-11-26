<script setup>
import { computed, onMounted } from 'vue'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut, Bar } from 'vue-chartjs'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import { getCategoryIcon } from '@/utils/categoryIcons'
import { formatCompactRupiah } from '@/utils/currencyUtils'
import { useFinanceStore } from '@/stores/financeStore'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const financeStore = useFinanceStore()

onMounted(async () => {
  await financeStore.fetchStatistics()
})

function formatDisplayDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(`${dateStr}T00:00:00`)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatShortDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(`${dateStr}T00:00:00`)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}

const categoryBreakdown = computed(() => financeStore.statistics?.category_breakdown ?? [])

const dailySeries = computed(() => {
  if (financeStore.statistics?.daily_series?.length) {
    return financeStore.statistics.daily_series
  }
  const expenses = financeStore.statistics?.daily_expenses ?? []
  return expenses.map((item) => ({
    date: item.date,
    income: 0,
    expense: item.total,
  }))
})

// Data Donut Chart Kategori
const doughnutChartData = computed(() => ({
  labels: categoryBreakdown.value.map((c) => c.category_name),
  datasets: [
    {
      data: categoryBreakdown.value.map((c) => c.total),
      backgroundColor: categoryBreakdown.value.map((c) => c.color || '#144229'),
      borderWidth: 2,
      borderColor: 'transparent',
      hoverOffset: 6,
    },
  ],
}))

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label(ctx) {
          return `${ctx.label}: ${formatCompactRupiah(ctx.parsed)}`
        },
      },
    },
  },
}

// Data Bar Chart Harian Pemasukan vs Pengeluaran
const barChartData = computed(() => ({
  labels: dailySeries.value.map((d) => formatShortDate(d.date)),
  datasets: [
    {
      label: 'Pemasukan',
      data: dailySeries.value.map((d) => d.income || 0),
      backgroundColor: '#144229',
      borderRadius: 6,
      maxBarThickness: 22,
    },
    {
      label: 'Pengeluaran',
      data: dailySeries.value.map((d) => d.expense || 0),
      backgroundColor: '#ba1a1a',
      borderRadius: 6,
      maxBarThickness: 22,
    },
  ],
}))

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
        pointStyle: 'circle',
        font: {
          size: 11,
          weight: 'bold',
        },
      },
    },
    tooltip: {
      callbacks: {
        label(ctx) {
          return `${ctx.dataset.label}: ${formatCompactRupiah(ctx.parsed.y)}`
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.14)' },
      ticks: {
        font: { size: 10 },
        callback(val) {
          return formatCompactRupiah(val)
        },
      },
    },
  },
}
</script>

<template>
  <div class="space-y-4 md:space-y-5">
    <!-- Header -->
    <div>
      <BaseHeading as="h2" size="xl" weight="semibold">Statistik Keuangan</BaseHeading>
      <BaseText size="sm" variant="muted" class="mt-0.5">
        Analisis proporsi pengeluaran per kategori dan tren arus kas harian pada periode terpilih.
      </BaseText>
    </div>

    <!-- 3 Metrics Card Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <BaseCard padding="p-4" class="space-y-1">
        <span class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
          Total Pemasukan
        </span>
        <div class="text-xl font-extrabold text-[#144229] dark:text-[#a1d2af] tabular-nums">
          {{ financeStore.formatMoney(financeStore.statistics?.income || 0) }}
        </div>
      </BaseCard>

      <BaseCard padding="p-4" class="space-y-1">
        <span class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
          Total Pengeluaran
        </span>
        <div class="text-xl font-extrabold text-[#ba1a1a] dark:text-rose-400 tabular-nums">
          {{ financeStore.formatMoney(financeStore.statistics?.expense || 0) }}
        </div>
      </BaseCard>

      <BaseCard padding="p-4" class="space-y-1">
        <span class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
          Net Cashflow (Selisih)
        </span>
        <div
          class="text-xl font-extrabold tabular-nums"
          :class="
            Number(financeStore.statistics?.net_savings || 0) < 0
              ? 'text-[#ba1a1a] dark:text-rose-400'
              : 'text-[#144229] dark:text-[#a1d2af]'
          "
        >
          {{ financeStore.formatMoney(financeStore.statistics?.net_savings || 0, { withSign: true }) }}
        </div>
        <span class="text-[11px] text-slate-400 dark:text-zinc-500 block tabular-nums">
          Rasio Tabungan: {{ financeStore.statistics?.savings_rate ?? 0 }}%
        </span>
      </BaseCard>
    </div>

    <!-- Grid 2 Kolom Desktop: Donut Kategori & Bar Tren Harian -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- KARTU 1: Donut Chart & Breakdown Kategori -->
      <BaseCard padding="p-4 sm:p-5" class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Proporsi Pengeluaran per Kategori
          </h3>
          <span class="text-xs text-slate-400 dark:text-zinc-500 tabular-nums">
            {{ categoryBreakdown.length }} Kategori
          </span>
        </div>

        <div
          v-if="categoryBreakdown.length === 0"
          class="py-10 text-center text-xs text-slate-400 dark:text-zinc-500"
        >
          Belum ada data pengeluaran di periode ini.
        </div>

        <template v-else>
          <!-- Donut Visual -->
          <div class="relative h-52 flex items-center justify-center">
            <Doughnut :data="doughnutChartData" :options="doughnutChartOptions" />
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Total Keluar
              </span>
              <span class="text-sm font-extrabold text-slate-900 dark:text-zinc-100 tabular-nums mt-0.5">
                {{ financeStore.formatMoney(financeStore.statistics?.expense || 0, { compact: true }) }}
              </span>
            </div>
          </div>

          <!-- Daftar Kategori Lengkap dengan Ikon & Warna Asli -->
          <div class="space-y-3 pt-2 border-t border-[#e2e2e5] dark:border-zinc-800">
            <div
              v-for="(item, idx) in categoryBreakdown"
              :key="item.category_id ?? `uncat-${idx}`"
              class="space-y-1.5 text-xs"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div
                    class="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                    :style="{ backgroundColor: item.color || '#144229' }"
                  >
                    <component :is="getCategoryIcon(item.icon)" class="w-3.5 h-3.5 stroke-[2]" />
                  </div>
                  <span class="font-bold text-slate-800 dark:text-zinc-200 truncate">
                    {{ item.category_name }}
                  </span>
                </div>
                <div class="flex items-center gap-2 tabular-nums shrink-0">
                  <span class="font-bold text-slate-900 dark:text-zinc-100">
                    {{ financeStore.formatMoney(item.total) }}
                  </span>
                  <span class="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 w-11 text-right">
                    {{ item.percentage }}%
                  </span>
                </div>
              </div>
              <div class="w-full h-2 rounded-full bg-[#f3f3f6] dark:bg-zinc-800 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :style="{
                    width: `${Math.min(100, item.percentage)}%`,
                    backgroundColor: item.color || '#144229',
                  }"
                ></div>
              </div>
            </div>
          </div>
        </template>
      </BaseCard>

      <!-- KARTU 2: Bar Chart Tren Harian & Riwayat Harian -->
      <BaseCard padding="p-4 sm:p-5" class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Tren Harian Pemasukan vs Pengeluaran
          </h3>
          <span class="text-xs text-slate-400 dark:text-zinc-500 tabular-nums">
            {{ dailySeries.length }} Hari Aktif
          </span>
        </div>

        <div
          v-if="dailySeries.length === 0"
          class="py-10 text-center text-xs text-slate-400 dark:text-zinc-500"
        >
          Belum ada catatan arus kas harian di periode ini.
        </div>

        <template v-else>
          <!-- Grafik Bar Chart -->
          <div class="h-56">
            <Bar :data="barChartData" :options="barChartOptions" />
          </div>

          <!-- Ringkasan Harian Detail -->
          <div class="divide-y divide-[#e2e2e5] dark:divide-zinc-800/80 text-xs pt-2 border-t border-[#e2e2e5] dark:border-zinc-800 max-h-64 overflow-y-auto pr-1">
            <div
              v-for="day in [...dailySeries].reverse()"
              :key="day.date"
              class="py-2.5 flex items-center justify-between first:pt-0 last:pb-0"
            >
              <span class="text-slate-700 dark:text-zinc-300 font-semibold">
                {{ formatDisplayDate(day.date) }}
              </span>
              <div class="flex items-center gap-3 tabular-nums">
                <span
                  v-if="day.income > 0"
                  class="font-bold text-[#144229] dark:text-[#a1d2af]"
                >
                  {{ financeStore.formatMoney(day.income, { withSign: true, compact: true }) }}
                </span>
                <span
                  v-if="day.expense > 0"
                  class="font-bold text-[#ba1a1a] dark:text-rose-400"
                >
                  {{ financeStore.formatMoney(-Math.abs(day.expense), { withSign: true, compact: true }) }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </BaseCard>
    </div>
  </div>
</template>
