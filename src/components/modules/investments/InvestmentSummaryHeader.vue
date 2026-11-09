<script setup>
import { ref } from 'vue'
import { Plus, Eye, EyeClosed, MoreHoriz } from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { formatRupiah, formatCompactRupiah, formatPercent } from '@/utils/currencyUtils'

defineProps({
  summary: {
    type: Object,
    required: true,
  },
  isMasked: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['open-cash', 'toggle-privacy'])

const menuOpen = ref(false)

function openCash(mode) {
  menuOpen.value = false
  emit('open-cash', mode)
}

function plLight(val) {
  const num = Number(val || 0)
  if (num > 0) return 'text-emerald-300'
  if (num < 0) return 'text-rose-300'
  return 'text-white'
}
</script>

<template>
  <div class="space-y-3">
    <!-- Hero: Total Portofolio -->
    <BaseCard
      padding="p-4 sm:p-5"
      class="bg-gradient-to-br from-[#144229] to-[#0d2e1c] text-white border-none shadow-floating"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-[#d3e4d8]/85">
            Total Portofolio
          </p>
          <p class="mt-1 text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight truncate">
            {{ isMasked ? 'Rp ****' : formatRupiah(summary.total_portfolio_value) }}
          </p>
        </div>
        <button
          type="button"
          @click="emit('toggle-privacy')"
          class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 active:scale-95 text-[#d3e4d8] transition-all cursor-pointer"
          :aria-label="isMasked ? 'Tampilkan nominal' : 'Sembunyikan nominal'"
        >
          <component :is="isMasked ? EyeClosed : Eye" class="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>

      <div class="mt-3 pt-3 border-t border-white/15 grid grid-cols-2 gap-x-3 gap-y-2 text-xs tabular-nums">
        <div>
          <span class="text-[11px] text-[#d3e4d8]/75 block">P/L Aktif</span>
          <span class="font-bold" :class="isMasked ? 'text-white' : plLight(summary.unrealized_pl)">
            {{ isMasked ? '****' : `${formatCompactRupiah(summary.unrealized_pl, { withSign: true })} (${formatPercent(summary.unrealized_pl_percent)})` }}
          </span>
        </div>
        <div>
          <span class="text-[11px] text-[#d3e4d8]/75 block">P/L Harian</span>
          <span class="font-bold" :class="isMasked ? 'text-white' : plLight(summary.daily_pl)">
            {{ isMasked ? '****' : formatCompactRupiah(summary.daily_pl, { withSign: true }) }}
          </span>
        </div>
        <div>
          <span class="text-[11px] text-[#d3e4d8]/75 block">Nilai Saham · {{ summary.active_tickers_count || 0 }} emiten</span>
          <span class="font-bold text-white">
            {{ isMasked ? '****' : formatCompactRupiah(summary.stock_market_value) }}
          </span>
        </div>
        <div>
          <span class="text-[11px] text-[#d3e4d8]/75 block">Realized</span>
          <span class="font-bold" :class="isMasked ? 'text-white' : plLight(summary.realized_pl)">
            {{ isMasked ? '****' : formatCompactRupiah(summary.realized_pl, { withSign: true }) }}
          </span>
        </div>
      </div>
    </BaseCard>

    <!-- Cash RDN: satu baris -->
    <BaseCard padding="p-3.5 sm:p-4" class="relative">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Cash RDN
            <span
              v-if="Number(summary.cash_balance) < 0"
              class="ml-1 normal-case text-[#ba1a1a] dark:text-rose-400 font-bold"
            >· Minus</span>
          </p>
          <p
            class="text-lg font-extrabold tabular-nums truncate"
            :class="
              !isMasked && Number(summary.cash_balance) < 0
                ? 'text-[#ba1a1a] dark:text-rose-400'
                : 'text-slate-900 dark:text-zinc-100'
            "
          >
            {{ isMasked ? 'Rp ****' : formatRupiah(summary.cash_balance) }}
          </p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            @click="openCash('topup')"
            class="inline-flex items-center gap-1 h-9 px-3.5 rounded-full text-xs font-bold bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] active:scale-95 transition-all cursor-pointer"
          >
            <Plus class="w-4 h-4 stroke-[2.5]" />
            <span>Top-Up</span>
          </button>
          <button
            type="button"
            @click="menuOpen = !menuOpen"
            class="w-9 h-9 rounded-full flex items-center justify-center bg-[#f3f3f6] dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 cursor-pointer"
            aria-label="Menu cash"
          >
            <MoreHoriz class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        v-if="menuOpen"
        class="absolute right-3 top-full mt-1 z-20 w-40 rounded-2xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-floating p-1.5 text-sm font-semibold"
      >
        <button
          type="button"
          class="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#f3f3f6] dark:hover:bg-zinc-800 cursor-pointer"
          @click="openCash('withdraw')"
        >
          Tarik Dana
        </button>
        <button
          type="button"
          class="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#f3f3f6] dark:hover:bg-zinc-800 cursor-pointer"
          @click="openCash('adjustment')"
        >
          Atur Saldo
        </button>
      </div>
    </BaseCard>
  </div>
</template>
