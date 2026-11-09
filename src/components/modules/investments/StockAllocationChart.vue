<script setup>
import { ref, computed } from 'vue'
import { PercentageCircle, Plus, NavArrowRight } from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { formatCompactRupiah, formatPercent } from '@/utils/currencyUtils'

const props = defineProps({
  stocks: {
    type: Array,
    default: () => [],
  },
  totalMarketValue: {
    type: Number,
    default: 0,
  },
  isMasked: {
    type: Boolean,
    default: false,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-ticker', 'buy'])

const hoveredTicker = ref(null)

// Palet warna Mint & Charcoal Financial yang harmonis & kontras
const PALETTE = [
  '#144229', // Deep Forest (Porsi Terbesar #1)
  '#2d5a3f', // Forest Mid (#2)
  '#22c55e', // Emerald Live Green (#3)
  '#0284c7', // Sky Blue Accent (#4)
  '#f59e0b', // Amber Gold Accent (#5)
  '#717972', // Slate Charcoal Muted ('Lainnya')
]

const activeStocks = computed(() => {
  return props.stocks.filter((s) => Number(s.market_value || 0) > 0)
})

const effectiveTotalMarketValue = computed(() => {
  if (props.totalMarketValue > 0) return props.totalMarketValue
  return activeStocks.value.reduce((sum, s) => sum + Number(s.market_value || 0), 0)
})

// Hitung data slice (Top 5 + Lainnya jika > 5)
const chartItems = computed(() => {
  const stocks = activeStocks.value
  const totalVal = effectiveTotalMarketValue.value
  if (!stocks.length || totalVal <= 0) return []

  const sorted = [...stocks].sort((a, b) => Number(b.market_value || 0) - Number(a.market_value || 0))

  let items = []
  if (sorted.length <= 5) {
    items = sorted.map((s, idx) => ({
      ticker: s.ticker,
      name: s.company_name,
      market_value: Number(s.market_value || 0),
      percent: (Number(s.market_value || 0) / totalVal) * 100,
      color: PALETTE[idx % PALETTE.length],
      lots: s.total_lots,
    }))
  } else {
    const top5 = sorted.slice(0, 5).map((s, idx) => ({
      ticker: s.ticker,
      name: s.company_name,
      market_value: Number(s.market_value || 0),
      percent: (Number(s.market_value || 0) / totalVal) * 100,
      color: PALETTE[idx],
      lots: s.total_lots,
    }))

    const others = sorted.slice(5)
    const othersVal = others.reduce((sum, s) => sum + Number(s.market_value || 0), 0)
    const othersLots = others.reduce((sum, s) => sum + Number(s.total_lots || 0), 0)

    top5.push({
      ticker: 'Lainnya',
      name: `${others.length} emiten lainnya`,
      market_value: othersVal,
      percent: (othersVal / totalVal) * 100,
      color: PALETTE[5],
      lots: othersLots,
      isOthers: true,
    })
    items = top5
  }

  // Hitung offset kumulatif untuk SVG stroke-dashoffset (keliling = 100)
  let cumulative = 0
  return items.map((item) => {
    const offset = cumulative
    cumulative += item.percent
    return {
      ...item,
      dasharray: `${item.percent} ${100 - item.percent}`,
      dashoffset: -offset,
    }
  })
})

const activeHoverItem = computed(() => {
  if (!hoveredTicker.value) return null
  return chartItems.value.find((i) => i.ticker === hoveredTicker.value)
})

function handleItemClick(item) {
  if (!item || item.isOthers) return
  emit('select-ticker', item.ticker)
}
</script>

<template>
  <!-- ================= COMPACT MODE (UNTUK DASHBOARD) ================= -->
  <div v-if="compact" class="flex flex-col sm:flex-row items-center gap-3">
    <!-- SVG Donut Ring Mini (Circumference = 100) -->
    <div v-if="chartItems.length > 0" class="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 42 42" class="w-full h-full" style="transform: rotate(-90deg)">
        <!-- Background track ring -->
        <circle
          cx="21"
          cy="21"
          r="15.91549430918954"
          fill="transparent"
          stroke="currentColor"
          stroke-width="4.5"
          class="text-slate-100 dark:text-zinc-800"
        />
        <!-- Segmen slice proporsi -->
        <circle
          v-for="item in chartItems"
          :key="item.ticker"
          cx="21"
          cy="21"
          r="15.91549430918954"
          fill="transparent"
          :stroke="item.color"
          :stroke-width="hoveredTicker === item.ticker ? 6 : 4.5"
          :stroke-dasharray="item.dasharray"
          :stroke-dashoffset="item.dashoffset"
          stroke-linecap="butt"
          class="transition-all duration-200 cursor-pointer"
          @mouseenter="hoveredTicker = item.ticker"
          @mouseleave="hoveredTicker = null"
          @click="handleItemClick(item)"
        >
          <title>{{ item.ticker }}: {{ item.percent.toFixed(1) }}%</title>
        </circle>
      </svg>

      <!-- Center text badge -->
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
        <span class="text-[11px] font-extrabold text-slate-800 dark:text-zinc-100 tabular-nums">
          {{ isMasked ? '****' : `${activeStocks.length}` }}
        </span>
        <span class="text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Saham
        </span>
      </div>
    </div>

    <!-- Empty ring for compact -->
    <div v-else class="relative w-20 h-20 shrink-0 flex items-center justify-center">
      <div class="w-full h-full rounded-full border-2 border-dashed border-slate-300 dark:border-zinc-700" />
      <PercentageCircle class="w-5 h-5 text-slate-400 absolute" />
    </div>

    <!-- Mini Legend Chips -->
    <div class="flex-1 min-w-0">
      <p class="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
        Proporsi Terbesar
      </p>
      <div v-if="chartItems.length > 0" class="flex flex-wrap gap-1.5">
        <button
          v-for="item in chartItems.slice(0, 4)"
          :key="item.ticker"
          type="button"
          @mouseenter="hoveredTicker = item.ticker"
          @mouseleave="hoveredTicker = null"
          @click="handleItemClick(item)"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer"
          :class="item.isOthers
            ? 'bg-slate-100 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
            : hoveredTicker === item.ticker
              ? 'ring-2 ring-[#144229] dark:ring-[#a1d2af] bg-white dark:bg-zinc-900 border-transparent text-slate-900 dark:text-zinc-100'
              : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:border-[#144229] dark:hover:border-[#a1d2af]'"
        >
          <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: item.color }" />
          <span>{{ item.ticker }}</span>
          <span class="text-slate-500 dark:text-zinc-400 font-semibold">{{ item.percent.toFixed(0) }}%</span>
        </button>
      </div>
      <p v-else class="text-xs text-slate-400 dark:text-zinc-500">
        Belum ada saham aktif
      </p>
    </div>
  </div>

  <!-- ================= FULL CARD MODE (UNTUK INVESTMENT VIEW) ================= -->
  <BaseCard v-else padding="p-4 sm:p-5" class="flex flex-col justify-between h-full shadow-surface">
    <!-- Header Kartu -->
    <div class="flex items-center justify-between gap-2 mb-2">
      <div class="flex items-center gap-2 min-w-0">
        <span class="w-8 h-8 rounded-xl flex items-center justify-center bg-[#d3e4d8]/70 dark:bg-[#2d5a3f]/50 text-[#144229] dark:text-[#a1d2af] shrink-0">
          <PercentageCircle class="w-4 h-4 stroke-[2.2]" />
        </span>
        <div class="min-w-0">
          <h3 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
            Proporsi Saham
          </h3>
          <p class="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
            Alokasi nilai pasar portofolio
          </p>
        </div>
      </div>

      <span
        v-if="chartItems.length > 0"
        class="text-[11px] font-bold tabular-nums px-2.5 py-0.5 rounded-full bg-[#f3f3f6] dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 shrink-0"
      >
        {{ activeStocks.length }} Emiten
      </span>
    </div>

    <!-- Kondisi 1: Ada Saham (SVG Donut Chart + Legenda) -->
    <div v-if="chartItems.length > 0" class="flex-1 flex flex-col justify-center">
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 py-1">
        <!-- SVG Donut Ring (Circumference = 100) -->
        <div class="relative w-36 h-36 sm:w-40 sm:h-40 shrink-0">
          <svg viewBox="0 0 42 42" class="w-full h-full" style="transform: rotate(-90deg)">
            <!-- Background track ring -->
            <circle
              cx="21"
              cy="21"
              r="15.91549430918954"
              fill="transparent"
              stroke="currentColor"
              stroke-width="5"
              class="text-slate-100 dark:text-zinc-800"
            />
            <!-- Slices -->
            <circle
              v-for="item in chartItems"
              :key="item.ticker"
              cx="21"
              cy="21"
              r="15.91549430918954"
              fill="transparent"
              :stroke="item.color"
              :stroke-width="hoveredTicker === item.ticker ? 6.8 : 5"
              :stroke-dasharray="item.dasharray"
              :stroke-dashoffset="item.dashoffset"
              stroke-linecap="butt"
              class="transition-all duration-200 cursor-pointer"
              @mouseenter="hoveredTicker = item.ticker"
              @mouseleave="hoveredTicker = null"
              @click="handleItemClick(item)"
            >
              <title>{{ item.ticker }}: {{ item.percent.toFixed(1) }}% ({{ formatCompactRupiah(item.market_value) }})</title>
            </circle>
          </svg>

          <!-- Center text inside donut -->
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
            <template v-if="activeHoverItem">
              <span class="text-xs sm:text-sm font-extrabold text-[#144229] dark:text-[#a1d2af]">
                {{ activeHoverItem.ticker }}
              </span>
              <span class="text-[11px] font-bold tabular-nums text-slate-700 dark:text-zinc-200">
                {{ activeHoverItem.percent.toFixed(1) }}%
              </span>
            </template>
            <template v-else>
              <span class="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-zinc-100 tabular-nums">
                {{ isMasked ? 'Rp ****' : formatCompactRupiah(effectiveTotalMarketValue) }}
              </span>
              <span class="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Total Saham
              </span>
            </template>
          </div>
        </div>

        <!-- Legenda Chip Interaktif -->
        <div class="w-full sm:flex-1 grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
          <button
            v-for="item in chartItems"
            :key="item.ticker"
            type="button"
            @mouseenter="hoveredTicker = item.ticker"
            @mouseleave="hoveredTicker = null"
            @click="handleItemClick(item)"
            class="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer group active:scale-95"
            :class="hoveredTicker === item.ticker
              ? 'ring-2 ring-[#144229] dark:ring-[#a1d2af] bg-white dark:bg-zinc-800 border-transparent'
              : 'border-[#e2e2e5] dark:border-zinc-800 bg-[#f9f9fc] dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800/70'"
            :title="item.isOthers ? item.name : `Klik untuk filter saham ${item.ticker}`"
          >
            <div class="flex items-center gap-1.5 min-w-0">
              <span
                class="w-2.5 h-2.5 rounded-full shrink-0"
                :style="{ backgroundColor: item.color }"
              />
              <span class="text-xs font-extrabold text-slate-800 dark:text-zinc-200 group-hover:text-[#144229] dark:group-hover:text-[#a1d2af] truncate">
                {{ item.ticker }}
              </span>
            </div>
            <span class="text-xs font-bold tabular-nums text-slate-600 dark:text-zinc-300 shrink-0">
              {{ item.percent.toFixed(1) }}%
            </span>
          </button>
        </div>
      </div>

      <p class="mt-2.5 text-[10px] text-center text-slate-400 dark:text-zinc-500">
        Ketuk irisan donat atau emiten di legenda untuk memfilter daftar saham.
      </p>
    </div>

    <!-- Kondisi 2: Empty State (Belum ada saham aktif) -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-center p-4 py-6">
      <div class="relative w-20 h-20 mb-2.5 flex items-center justify-center">
        <div class="w-full h-full rounded-full border-4 border-dashed border-slate-200 dark:border-zinc-800" />
        <PercentageCircle class="w-6 h-6 text-slate-300 dark:text-zinc-600 absolute" />
      </div>
      <p class="text-xs font-bold text-slate-800 dark:text-zinc-200">Belum Ada Saham Aktif</p>
      <p class="text-[11px] text-slate-400 dark:text-zinc-500 max-w-[220px] mt-0.5">
        Beli saham pertamamu untuk melihat persentase alokasi portofolio.
      </p>
      <button
        type="button"
        @click="emit('buy')"
        class="mt-3 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] active:scale-95 transition-all cursor-pointer shadow-xs"
      >
        <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Beli Saham</span>
      </button>
    </div>
  </BaseCard>
</template>
