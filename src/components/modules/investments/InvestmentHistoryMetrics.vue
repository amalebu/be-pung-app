<script setup>
import { computed } from 'vue'
import { Eye, EyeClosed, CheckCircle, GraphUp } from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { formatRupiah, formatCompactRupiah, formatPercent } from '@/utils/currencyUtils'

const props = defineProps({
  metrics: {
    type: Object,
    required: true,
  },
  isMasked: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-privacy'])

function plColor(val) {
  const num = Number(val || 0)
  if (num > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (num < 0) return 'text-[#ba1a1a] dark:text-rose-400'
  return 'text-slate-600 dark:text-zinc-400'
}

const winRateDisplay = computed(() => {
  if (!props.metrics.totalCount) return '0%'
  return `${props.metrics.winRatePercent.toFixed(1)}%`
})

const winBarWidth = computed(() => {
  if (!props.metrics.totalCount) return 50
  return Math.min(Math.max(props.metrics.winRatePercent, 5), 95)
})
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
    <!-- Card 1: Total Realized P/L -->
    <BaseCard padding="p-3.5" class="relative overflow-hidden flex flex-col justify-between">
      <div class="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
        <span class="truncate">Total Realized P/L</span>
        <button
          type="button"
          @click="emit('toggle-privacy')"
          class="p-1 -mr-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          :title="isMasked ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'"
        >
          <EyeClosed v-if="isMasked" class="w-3.5 h-3.5" />
          <Eye v-else class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="mt-2">
        <div
          v-if="isMasked"
          class="text-lg sm:text-xl font-extrabold tracking-tight text-slate-400 dark:text-zinc-500"
        >
          ••••••••
        </div>
        <div
          v-else
          class="text-lg sm:text-xl font-extrabold tracking-tight tabular-nums truncate"
          :class="plColor(metrics.totalRealized)"
          :title="formatRupiah(metrics.totalRealized, { withSign: true })"
        >
          {{ formatRupiah(metrics.totalRealized, { withSign: true }) }}
        </div>
        <div class="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-500 font-medium truncate">
          {{ metrics.totalCount }} transaksi selesai
        </div>
      </div>
    </BaseCard>

    <!-- Card 2: Realized Hari Ini -->
    <BaseCard padding="p-3.5" class="relative overflow-hidden flex flex-col justify-between">
      <div class="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
        <span>Realized Hari Ini</span>
        <span class="w-2 h-2 rounded-full" :class="Number(metrics.todayRealized) !== 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-zinc-700'" />
      </div>

      <div class="mt-2">
        <div
          v-if="isMasked"
          class="text-lg sm:text-xl font-extrabold tracking-tight text-slate-400 dark:text-zinc-500"
        >
          ••••••••
        </div>
        <div
          v-else
          class="text-lg sm:text-xl font-extrabold tracking-tight tabular-nums truncate"
          :class="plColor(metrics.todayRealized)"
          :title="formatRupiah(metrics.todayRealized, { withSign: true })"
        >
          {{ formatRupiah(metrics.todayRealized, { withSign: true }) }}
        </div>
        <div class="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-500 font-medium truncate">
          Penjualan hari ini
        </div>
      </div>
    </BaseCard>

    <!-- Card 3: Win vs Loss & Win Rate -->
    <BaseCard padding="p-3.5" class="col-span-2 md:col-span-1 relative overflow-hidden flex flex-col justify-between">
      <div class="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
        <span>Win vs Loss</span>
        <span class="text-[11px] font-bold text-slate-700 dark:text-zinc-200 tabular-nums">
          {{ metrics.winCount }}W - {{ metrics.lossCount }}L
        </span>
      </div>

      <div class="mt-2">
        <div class="flex items-baseline justify-between gap-1">
          <span class="text-lg sm:text-xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-zinc-100">
            {{ winRateDisplay }}
          </span>
          <span class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Win Rate</span>
        </div>

        <!-- Split Progress Bar -->
        <div class="mt-2 w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden flex">
          <div
            class="h-full bg-emerald-500 transition-all duration-300"
            :style="{ width: `${winBarWidth}%` }"
          />
          <div
            class="h-full bg-rose-500 transition-all duration-300"
            :style="{ width: `${100 - winBarWidth}%` }"
          />
        </div>
      </div>
    </BaseCard>

    <!-- Card 4: Max Win -->
    <BaseCard padding="p-3.5" class="relative overflow-hidden flex flex-col justify-between">
      <div class="flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        <span class="flex items-center gap-1">
          <CheckCircle class="w-3.5 h-3.5" />
          <span>Max Win</span>
        </span>
        <span
          v-if="metrics.maxWin"
          class="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase"
        >
          {{ metrics.maxWin.ticker }}
        </span>
      </div>

      <div class="mt-2">
        <template v-if="metrics.maxWin">
          <div
            v-if="isMasked"
            class="text-lg sm:text-xl font-extrabold tracking-tight text-slate-400 dark:text-zinc-500"
          >
            ••••••••
          </div>
          <div
            v-else
            class="text-lg sm:text-xl font-extrabold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400 truncate"
            :title="formatRupiah(metrics.maxWin.realized_pl, { withSign: true })"
          >
            {{ formatCompactRupiah(metrics.maxWin.realized_pl, { withSign: true }) }}
          </div>
          <div class="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-500 font-medium truncate">
            {{ formatPercent(metrics.maxWin.realized_pl_percent) }} profit
          </div>
        </template>
        <template v-else>
          <div class="text-sm font-bold text-slate-400 dark:text-zinc-600">Belum Ada</div>
          <div class="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-600">-</div>
        </template>
      </div>
    </BaseCard>

    <!-- Card 5: Max Loss -->
    <BaseCard padding="p-3.5" class="relative overflow-hidden flex flex-col justify-between">
      <div class="flex items-center justify-between text-[11px] font-semibold text-[#ba1a1a] dark:text-rose-400">
        <span class="flex items-center gap-1">
          <GraphUp class="w-3.5 h-3.5 rotate-180" />
          <span>Max Loss</span>
        </span>
        <span
          v-if="metrics.maxLoss"
          class="px-1.5 py-0.2 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-extrabold uppercase"
        >
          {{ metrics.maxLoss.ticker }}
        </span>
      </div>

      <div class="mt-2">
        <template v-if="metrics.maxLoss">
          <div
            v-if="isMasked"
            class="text-lg sm:text-xl font-extrabold tracking-tight text-slate-400 dark:text-zinc-500"
          >
            ••••••••
          </div>
          <div
            v-else
            class="text-lg sm:text-xl font-extrabold tracking-tight tabular-nums text-[#ba1a1a] dark:text-rose-400 truncate"
            :title="formatRupiah(metrics.maxLoss.realized_pl, { withSign: true })"
          >
            {{ formatCompactRupiah(metrics.maxLoss.realized_pl, { withSign: true }) }}
          </div>
          <div class="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-500 font-medium truncate">
            {{ formatPercent(metrics.maxLoss.realized_pl_percent) }} loss
          </div>
        </template>
        <template v-else>
          <div class="text-sm font-bold text-slate-400 dark:text-zinc-600">Belum Ada</div>
          <div class="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-600">-</div>
        </template>
      </div>
    </BaseCard>
  </div>
</template>
