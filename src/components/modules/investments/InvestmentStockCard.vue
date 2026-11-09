<script setup>
import { NavArrowDown, NavArrowUp, Plus, EditPencil, CheckCircle } from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StockAvatar from '@/components/ui/StockAvatar.vue'
import {
  formatRupiah,
  formatCompactRupiah,
  formatSharePrice,
  formatPercent,
} from '@/utils/currencyUtils'

defineProps({
  stock: {
    type: Object,
    required: true,
  },
  expanded: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'toggle-expand',
  'buy-more',
  'edit-lot',
  'close-lot',
  'close-all',
])

function plColor(val) {
  const num = Number(val || 0)
  if (num > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (num < 0) return 'text-[#ba1a1a] dark:text-rose-400'
  return 'text-slate-600 dark:text-zinc-400'
}

function formatDateSlash(dateStr) {
  if (!dateStr) return '-'
  const [y, m, d] = String(dateStr).split('-')
  if (!y || !m || !d) return dateStr
  return `${d}/${m}/${y}`
}
</script>

<template>
  <BaseCard
    padding="p-0"
    class="overflow-hidden transition-all duration-200"
    :class="expanded ? 'ring-2 ring-[#144229]/25 dark:ring-[#a1d2af]/30' : ''"
  >
    <!-- Ringkasan 2 baris (tap untuk expand) -->
    <div
      role="button"
      tabindex="0"
      @click="emit('toggle-expand', stock.id)"
      @keydown.enter.prevent="emit('toggle-expand', stock.id)"
      class="px-3.5 py-3 flex items-center gap-3 cursor-pointer select-none active:bg-[#f3f3f6]/70 dark:active:bg-zinc-800/40"
    >
      <StockAvatar :ticker="stock.ticker" :alt="stock.company_name" size="lg" class="shrink-0" />

      <div class="min-w-0 flex-1">
        <div class="flex items-baseline justify-between gap-2">
          <span class="text-base font-extrabold text-[#144229] dark:text-[#a1d2af]">
            {{ stock.ticker }}
          </span>
          <span
            class="text-sm font-extrabold tabular-nums"
            :class="plColor(stock.net_pl)"
            :title="formatRupiah(stock.net_pl, { withSign: true })"
          >
            {{ formatCompactRupiah(stock.net_pl, { withSign: true }) }}
          </span>
        </div>
        <div class="mt-0.5 flex items-baseline justify-between gap-2 text-xs tabular-nums">
          <span class="text-slate-600 dark:text-zinc-300 truncate">
            <span class="font-bold">{{ stock.total_lots }} Lot</span>
            × {{ formatSharePrice(stock.avg_buy_price) }}
            <span class="text-slate-400">· Skrg {{ formatSharePrice(stock.last_price) }}</span>
          </span>
          <span class="font-bold shrink-0" :class="plColor(stock.net_pl_percent)">
            {{ formatPercent(stock.net_pl_percent) }}
          </span>
        </div>
      </div>

      <!-- Kolom tambahan khusus desktop -->
      <div class="hidden md:grid grid-cols-4 gap-6 text-right text-xs tabular-nums shrink-0">
        <div>
          <span class="text-[10px] uppercase tracking-wider text-slate-400 block">Harga Avg</span>
          <span class="font-bold text-slate-800 dark:text-zinc-200">{{ formatSharePrice(stock.avg_buy_price, 2) }}</span>
        </div>
        <div>
          <span class="text-[10px] uppercase tracking-wider text-slate-400 block">Hrg Skrg</span>
          <span class="font-bold text-slate-900 dark:text-zinc-100">{{ formatSharePrice(stock.last_price, 2) }}</span>
        </div>
        <div>
          <span class="text-[10px] uppercase tracking-wider text-slate-400 block">Nilai Pasar</span>
          <span class="font-bold text-slate-900 dark:text-zinc-100">{{ formatCompactRupiah(stock.market_value) }}</span>
        </div>
        <div>
          <span class="text-[10px] uppercase tracking-wider text-slate-400 block">P/L Harian</span>
          <span class="font-bold" :class="plColor(stock.daily_pl)">
            {{ formatCompactRupiah(stock.daily_pl, { withSign: true }) }}
          </span>
        </div>
      </div>

      <component
        :is="expanded ? NavArrowUp : NavArrowDown"
        class="w-4 h-4 text-slate-400 shrink-0"
      />
    </div>

    <!-- Detail -->
    <div
      v-if="expanded"
      class="bg-[#f9f9fc] dark:bg-zinc-950/70 border-t border-[#e2e2e5] dark:border-zinc-800 px-3.5 py-3 space-y-3"
    >
      <p class="text-xs text-slate-500 dark:text-zinc-400 truncate">{{ stock.company_name }}</p>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-2 text-xs tabular-nums">
        <div>
          <span class="text-[11px] text-slate-400 block">Modal</span>
          <span class="font-bold text-slate-800 dark:text-zinc-200">{{ formatRupiah(stock.total_cost) }}</span>
        </div>
        <div>
          <span class="text-[11px] text-slate-400 block">Nilai Pasar</span>
          <span class="font-bold text-slate-800 dark:text-zinc-200">{{ formatRupiah(stock.market_value) }}</span>
        </div>
        <div>
          <span class="text-[11px] text-slate-400 block">Lembar</span>
          <span class="font-bold text-slate-800 dark:text-zinc-200">{{ stock.total_shares.toLocaleString('id-ID') }}</span>
        </div>
        <div>
          <span class="text-[11px] text-slate-400 block">P/L Harian</span>
          <span class="font-bold" :class="plColor(stock.daily_pl)">
            {{ formatCompactRupiah(stock.daily_pl, { withSign: true }) }}
          </span>
        </div>
      </div>

      <!-- Daftar lot -->
      <div class="divide-y divide-slate-200/70 dark:divide-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800">
        <div
          v-for="lot in stock.lots"
          :key="lot.id"
          class="flex items-center gap-2 px-3 py-2.5"
        >
          <div class="min-w-0 flex-1 text-xs tabular-nums">
            <div class="font-bold text-slate-800 dark:text-zinc-100">
              {{ lot.remaining_lots }} Lot × {{ formatSharePrice(lot.buy_price) }}
            </div>
            <div class="text-[11px] text-slate-500 dark:text-zinc-400">
              {{ formatDateSlash(lot.opened_at) }} · Komisi {{ formatRupiah(lot.allocated_fee) }}
            </div>
            <div class="text-[11px] font-bold" :class="plColor(lot.net_pl)">
              {{ formatRupiah(lot.net_pl, { withSign: true }) }} ({{ formatPercent(lot.net_pl_percent) }})
            </div>
          </div>

          <button
            type="button"
            @click.stop="emit('close-lot', { stock, lot })"
            class="w-10 h-10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
            aria-label="Tutup posisi"
          >
            <CheckCircle class="w-5 h-5" />
          </button>
          <button
            type="button"
            @click.stop="emit('edit-lot', { stock, lot })"
            class="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
            aria-label="Edit posisi"
          >
            <EditPencil class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click.stop="emit('buy-more', stock.ticker)"
          class="flex-1 inline-flex items-center justify-center gap-1 h-10 rounded-full text-xs font-bold bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] cursor-pointer"
        >
          <Plus class="w-4 h-4 stroke-[2.5]" />
          <span>Tambah Lot</span>
        </button>
        <button
          type="button"
          @click.stop="emit('close-all', stock)"
          class="flex-1 inline-flex items-center justify-center gap-1 h-10 rounded-full text-xs font-semibold bg-[#d3e4d8] text-[#144229] dark:bg-[#2d5a3f] dark:text-[#a1d2af] cursor-pointer"
        >
          <CheckCircle class="w-4 h-4" />
          <span>Jual Semua</span>
        </button>
      </div>
    </div>
  </BaseCard>
</template>
