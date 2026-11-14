<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { GraphUp, GraphDown, ArrowRight, Eye, EyeClosed, Plus } from '@iconoir/vue'
import StockAllocationChart from '@/components/modules/investments/StockAllocationChart.vue'
import { formatRupiah, formatCompactRupiah, formatPercent } from '@/utils/currencyUtils'

const props = defineProps({
  summary: {
    type: Object,
    required: true,
  },
  stocks: {
    type: Array,
    default: () => [],
  },
  isMasked: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-privacy', 'buy', 'select-ticker'])

const router = useRouter()

const isProfitable = computed(() => Number(props.summary.unrealized_pl || 0) >= 0)
const hasDailyGain = computed(() => Number(props.summary.daily_pl || 0) >= 0)

function handleSelectTicker(ticker) {
  emit('select-ticker', ticker)
}
</script>

<template>
  <section
    class="relative overflow-hidden rounded-3xl p-6 sm:p-7 text-white bg-gradient-to-br from-[#144229] via-[#1a4a30] to-[#245238] dark:from-[#102e1d] dark:via-[#143b25] dark:to-[#1a482f] shadow-[0px_10px_30px_rgba(20,66,41,0.18)] border border-white/10 dark:border-white/5"
  >
    <!-- Ornamen dekoratif blur -->
    <div class="pointer-events-none absolute -top-16 -right-12 w-64 h-64 rounded-full bg-[#a1d2af]/20 blur-3xl" />
    <div class="pointer-events-none absolute -bottom-20 left-10 w-56 h-56 rounded-full bg-[#d3e4d8]/10 blur-2xl" />

    <div class="relative grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
      <!-- Kolom Kiri: Info Finansial Portofolio & Aksi -->
      <div class="lg:col-span-7 flex flex-col justify-between min-w-0">
        <!-- Eyebrow + Privacy Toggle Button -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xs font-semibold uppercase tracking-[0.14em] text-[#a1d2af]">
              Portofolio Investasi
            </span>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/10 text-[#a1d2af] border border-white/10">
              BEI / IDX
            </span>
          </div>

          <button
            type="button"
            @click="emit('toggle-privacy')"
            class="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 text-[#a1d2af] transition-all cursor-pointer"
            :title="isMasked ? 'Tampilkan Nominal Saldo' : 'Sembunyikan Nominal Saldo'"
          >
            <component :is="isMasked ? EyeClosed : Eye" class="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        <!-- Nominal Utama Total Portofolio -->
        <div class="mt-3">
          <p class="text-xs text-white/70 font-medium">
            Total Portofolio & Kas RDN
          </p>
          <p class="mt-1 text-3xl sm:text-4xl lg:text-[42px] leading-tight font-extrabold tracking-tight tabular-nums truncate">
            {{ isMasked ? 'Rp ****' : formatRupiah(summary.total_portfolio_value) }}
          </p>
        </div>

        <!-- Glassmorphism Metric Badges -->
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <!-- P/L Berjalan -->
          <span
            class="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm tabular-nums"
          >
            <component
              :is="isProfitable ? GraphUp : GraphDown"
              class="w-3.5 h-3.5 shrink-0"
              :class="isMasked ? 'text-white' : isProfitable ? 'text-emerald-300' : 'text-rose-300'"
            />
            <span :class="isMasked ? 'text-white' : isProfitable ? 'text-emerald-300' : 'text-rose-300'">
              {{ isMasked ? 'P/L: ****' : `P/L: ${formatCompactRupiah(summary.unrealized_pl, { withSign: true })} (${formatPercent(summary.unrealized_pl_percent)})` }}
            </span>
          </span>

          <!-- P/L Harian -->
          <span
            class="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm tabular-nums text-white/90"
          >
            <span>Hari ini:</span>
            <span :class="isMasked ? 'text-white' : hasDailyGain ? 'text-emerald-300' : 'text-rose-300'">
              {{ isMasked ? '****' : formatCompactRupiah(summary.daily_pl, { withSign: true }) }}
            </span>
          </span>

          <!-- Kas RDN -->
          <span
            class="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm tabular-nums text-white/90"
          >
            <span>Kas RDN:</span>
            <span class="font-bold text-white">
              {{ isMasked ? 'Rp ****' : formatCompactRupiah(summary.cash_balance) }}
            </span>
          </span>

          <!-- Emiten Aktif -->
          <span
            class="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm text-[#a1d2af]"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-[#a1d2af]" />
            <span>{{ summary.active_tickers_count || 0 }} Emiten Aktif</span>
          </span>
        </div>

        <!-- Tombol Aksi -->
        <div class="mt-6 flex flex-wrap items-center gap-2.5">
          <RouterLink
            to="/investments"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold bg-white text-[#144229] hover:bg-[#d3e4d8] active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <span>Kelola Portofolio</span>
            <ArrowRight class="w-4 h-4" />
          </RouterLink>

          <button
            type="button"
            @click="emit('buy')"
            class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all backdrop-blur-sm cursor-pointer"
          >
            <Plus class="w-4 h-4 stroke-[2.5]" />
            <span>Beli Saham</span>
          </button>
        </div>
      </div>

      <!-- Kolom Kanan: Donut Chart Proporsi Saham Hero -->
      <div class="lg:col-span-5 flex flex-col items-center justify-center pt-4 lg:pt-0 lg:border-l lg:border-white/15 lg:pl-8">
        <StockAllocationChart
          variant="hero"
          :stocks="stocks"
          :total-market-value="summary.stock_market_value"
          :is-masked="isMasked"
          @select-ticker="handleSelectTicker"
          @buy="emit('buy')"
        />
      </div>
    </div>
  </section>
</template>
