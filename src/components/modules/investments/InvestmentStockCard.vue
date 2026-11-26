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

function plBgClass(val) {
  const num = Number(val || 0)
  if (num > 0) return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40'
  if (num < 0) return 'bg-rose-50 dark:bg-rose-950/40 text-[#ba1a1a] dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40'
  return 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
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
    class="overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700"
    :class="expanded ? 'ring-2 ring-[#144229]/25 dark:ring-[#a1d2af]/30 shadow-sm' : ''"
  >
    <!-- Ringkasan Kartu (tap untuk expand) -->
    <div
      role="button"
      tabindex="0"
      @click="emit('toggle-expand', stock.id)"
      @keydown.enter.prevent="emit('toggle-expand', stock.id)"
      class="px-4 py-3.5 flex items-center gap-3.5 cursor-pointer select-none active:bg-[#f3f3f6]/70 dark:active:bg-zinc-800/40 transition-colors"
    >
      <StockAvatar :ticker="stock.ticker" :alt="stock.company_name" size="lg" class="shrink-0 shadow-2xs" />

      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-base font-extrabold text-[#144229] dark:text-[#a1d2af] tracking-tight">
              {{ stock.ticker }}
            </span>
            <span class="text-xs text-slate-400 dark:text-zinc-500 truncate hidden sm:inline max-w-[150px]">
              {{ stock.company_name }}
            </span>
          </div>

          <span
            class="text-sm font-extrabold tabular-nums shrink-0"
            :class="plColor(stock.net_pl)"
            :title="formatRupiah(stock.net_pl, { withSign: true })"
          >
            {{ formatCompactRupiah(stock.net_pl, { withSign: true }) }}
          </span>
        </div>

        <div class="mt-1 flex items-baseline justify-between gap-2 text-xs tabular-nums">
          <div class="text-slate-600 dark:text-zinc-300 truncate">
            <span class="font-bold text-slate-900 dark:text-zinc-100">{{ stock.total_lots }} Lot</span>
            <span class="text-slate-400 mx-1">@</span>
            <span>{{ formatSharePrice(stock.avg_buy_price) }}</span>
            <span class="text-slate-400 mx-1">·</span>
            <span class="font-semibold text-slate-800 dark:text-zinc-200">Last {{ formatSharePrice(stock.last_price) }}</span>
          </div>

          <span
            class="font-bold shrink-0 text-xs tabular-nums"
            :class="plColor(stock.net_pl_percent)"
          >
            {{ formatPercent(stock.net_pl_percent) }}
          </span>
        </div>
      </div>

      <!-- Kolom Metrik Tambahan Khusus Desktop -->
      <div class="hidden md:grid grid-cols-4 gap-6 text-right text-xs tabular-nums shrink-0 pl-2 border-l border-slate-100 dark:border-zinc-800/80">
        <div>
          <span class="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">Harga Avg</span>
          <span class="font-bold text-slate-800 dark:text-zinc-200">Rp {{ formatSharePrice(stock.avg_buy_price, 2) }}</span>
        </div>
        <div>
          <span class="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">Hrg Pasar</span>
          <span class="font-bold text-slate-900 dark:text-zinc-100">Rp {{ formatSharePrice(stock.last_price, 2) }}</span>
        </div>
        <div>
          <span class="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">Nilai Pasar</span>
          <span class="font-bold text-slate-900 dark:text-zinc-100">{{ formatCompactRupiah(stock.market_value) }}</span>
        </div>
        <div>
          <span class="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">P/L Harian</span>
          <span class="font-bold" :class="plColor(stock.daily_pl)">
            {{ formatCompactRupiah(stock.daily_pl, { withSign: true }) }}
          </span>
        </div>
      </div>

      <div class="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 shrink-0">
        <component
          :is="expanded ? NavArrowUp : NavArrowDown"
          class="w-4 h-4 transition-transform duration-200"
        />
      </div>
    </div>

    <!-- Detail Accordion -->
    <Transition name="slide-fade">
      <div
        v-if="expanded"
        class="bg-[#f9f9fc] dark:bg-zinc-950/70 border-t border-[#e2e2e5] dark:border-zinc-800 px-4 py-3.5 space-y-3.5"
      >
        <div class="flex items-center justify-between">
          <p class="text-xs font-medium text-slate-600 dark:text-zinc-300 truncate">
            {{ stock.company_name }}
          </p>
          <span class="text-[11px] text-slate-400 tabular-nums">
            Total {{ stock.total_shares?.toLocaleString('id-ID') }} lembar
          </span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs tabular-nums">
          <div class="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
            <span class="text-[11px] text-slate-400 block">Total Modal</span>
            <span class="font-bold text-slate-800 dark:text-zinc-200">{{ formatRupiah(stock.total_cost) }}</span>
          </div>
          <div class="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
            <span class="text-[11px] text-slate-400 block">Nilai Pasar Saat Ini</span>
            <span class="font-bold text-slate-800 dark:text-zinc-200">{{ formatRupiah(stock.market_value) }}</span>
          </div>
          <div class="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
            <span class="text-[11px] text-slate-400 block">Unrealized P/L</span>
            <span class="font-bold" :class="plColor(stock.net_pl)">
              {{ formatRupiah(stock.net_pl, { withSign: true }) }}
            </span>
          </div>
          <div class="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
            <span class="text-[11px] text-slate-400 block">P/L Perubahan Hari Ini</span>
            <span class="font-bold" :class="plColor(stock.daily_pl)">
              {{ formatCompactRupiah(stock.daily_pl, { withSign: true }) }}
            </span>
          </div>
        </div>

        <!-- Rincian Lot Pembelian -->
        <div>
          <div class="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            Rincian Lot Pembelian ({{ stock.lots?.length || 0 }})
          </div>

          <TransitionGroup
            tag="div"
            name="list"
            class="divide-y divide-slate-200/70 dark:divide-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 relative overflow-hidden shadow-2xs"
          >
            <div
              v-for="lot in stock.lots"
              :key="lot.id"
              class="flex items-center gap-3 px-3.5 py-2.5 bg-white dark:bg-zinc-900 hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors"
            >
              <div class="min-w-0 flex-1 text-xs tabular-nums">
                <div class="flex items-baseline gap-2">
                  <span class="font-bold text-slate-800 dark:text-zinc-100">
                    {{ lot.remaining_lots }} Lot × Rp {{ formatSharePrice(lot.buy_price) }}
                  </span>
                  <span class="text-[11px] font-bold" :class="plColor(lot.net_pl)">
                    {{ formatRupiah(lot.net_pl, { withSign: true }) }} ({{ formatPercent(lot.net_pl_percent) }})
                  </span>
                </div>
                <div class="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-500">
                  Dibeli {{ formatDateSlash(lot.opened_at) }} · Komisi {{ formatRupiah(lot.allocated_fee) }}
                </div>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  @click.stop="emit('close-lot', { stock, lot })"
                  class="px-2.5 py-1.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer inline-flex items-center gap-1"
                  title="Jual Lot Ini"
                >
                  <CheckCircle class="w-3.5 h-3.5" />
                  <span>Jual</span>
                </button>
                <button
                  type="button"
                  @click.stop="emit('edit-lot', { stock, lot })"
                  class="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Edit Posisi Lot"
                >
                  <EditPencil class="w-4 h-4" />
                </button>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <!-- Tombol Aksi Cepat Kartu Saham -->
        <div class="flex items-center gap-2 pt-1">
          <button
            type="button"
            @click.stop="emit('buy-more', stock.ticker)"
            class="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-full text-xs font-bold bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] hover:bg-[#1e5839] active:scale-98 transition-all cursor-pointer shadow-2xs"
          >
            <Plus class="w-4 h-4 stroke-[2.5]" />
            <span>Beli Lagi</span>
          </button>
          <button
            type="button"
            @click.stop="emit('close-all', stock)"
            class="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-full text-xs font-semibold bg-[#d3e4d8] text-[#144229] dark:bg-[#2d5a3f] dark:text-[#a1d2af] hover:bg-[#c2d7c8] active:scale-98 transition-all cursor-pointer"
          >
            <CheckCircle class="w-4 h-4" />
            <span>Tutup Posisi (Jual Semua)</span>
          </button>
        </div>
      </div>
    </Transition>
  </BaseCard>
</template>
