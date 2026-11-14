<script setup>
import { computed } from 'vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import SecondaryButton from '@/components/ui/SecondaryButton.vue'
import StockAvatar from '@/components/ui/StockAvatar.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import {
  formatRupiah,
  formatSharePrice,
  formatPercent,
} from '@/utils/currencyUtils'
import { Trash, ArrowDown, ArrowUp, InfoCircle } from '@iconoir/vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  sale: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'delete'])

function plColor(val) {
  const num = Number(val || 0)
  if (num > 0) return 'text-[#144229] dark:text-[#a1d2af]'
  if (num < 0) return 'text-[#ba1a1a] dark:text-rose-400'
  return 'text-slate-500 dark:text-zinc-400'
}

const isProfitable = computed(() => Number(props.sale?.realized_pl || 0) >= 0)

function handleDeleteClick() {
  if (!props.sale) return
  emit('delete', props.sale)
}
</script>

<template>
  <BottomSheet
    :show="show"
    title="Rincian Transaksi Penjualan"
    @close="emit('close')"
  >
    <div v-if="sale" class="p-4 md:p-6 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
      <!-- 1. Header Card Emiten & Realized P/L -->
      <div
        class="flex items-center justify-between p-3.5 md:p-4 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60"
      >
        <div class="flex items-center gap-3 min-w-0">
          <StockAvatar
            :ticker="sale.ticker"
            :alt="sale.company_name"
            size="lg"
            class="shrink-0"
          />
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-black text-base md:text-lg text-[#144229] dark:text-[#a1d2af]">
                {{ sale.ticker }}
              </span>
              <BaseBadge :variant="isProfitable ? 'success' : 'danger'" size="xs">
                {{ isProfitable ? 'Profit' : 'Loss' }}
              </BaseBadge>
            </div>
            <p class="text-xs text-slate-600 dark:text-zinc-300 font-medium truncate max-w-[180px] md:max-w-xs">
              {{ sale.company_name || 'Saham Bursa Efek Indonesia' }}
            </p>
          </div>
        </div>

        <div class="text-right shrink-0">
          <div class="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">
            Realized P/L
          </div>
          <div
            class="text-base md:text-lg font-black tabular-nums"
            :class="plColor(sale.realized_pl)"
          >
            {{ formatRupiah(sale.realized_pl, { withSign: true }) }}
          </div>
          <div class="text-xs font-bold tabular-nums" :class="plColor(sale.realized_pl)">
            {{ formatPercent(sale.realized_pl_percent) }}
          </div>
        </div>
      </div>

      <!-- 2. Rincian Pembelian (Cost Basis) -->
      <div class="rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-surface">
        <div class="px-4 py-3 bg-[#f9f9fc] dark:bg-zinc-800/40 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2 font-bold text-slate-800 dark:text-zinc-200">
            <ArrowDown class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Rincian Pembelian (Modal / Cost Basis)</span>
          </div>
          <span class="text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums font-semibold">
            {{ sale.sold_lots }} Lot ({{ sale.sold_shares }} lbr)
          </span>
        </div>

        <!-- Tabel Lot jika multi-lot -->
        <div v-if="sale.buy_breakdown && sale.buy_breakdown.length > 1" class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-[11px] tabular-nums">
            <thead>
              <tr class="border-b border-slate-100 dark:border-zinc-800 bg-[#f3f3f6]/50 dark:bg-zinc-800/20 text-slate-500 dark:text-zinc-400">
                <th class="py-2 px-3 font-semibold">Tgl Beli</th>
                <th class="py-2 px-3 font-semibold text-right">Lot x Harga</th>
                <th class="py-2 px-3 font-semibold text-right">Total Beli</th>
                <th class="py-2 px-3 font-semibold text-right">Fee Beli</th>
                <th class="py-2 px-3 font-semibold text-right">Bersih Beli</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/60">
              <tr v-for="(b, idx) in sale.buy_breakdown" :key="idx" class="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                <td class="py-2 px-3 text-slate-600 dark:text-zinc-300">{{ b.opened_at }}</td>
                <td class="py-2 px-3 text-right">
                  <span class="font-bold">{{ b.lots }}</span> Lot @ Rp {{ formatSharePrice(b.buy_price) }}
                </td>
                <td class="py-2 px-3 text-right text-slate-700 dark:text-zinc-200">
                  {{ formatRupiah(b.gross_cost) }}
                </td>
                <td class="py-2 px-3 text-right text-slate-500 dark:text-zinc-400">
                  {{ formatRupiah(b.buy_fee) }}
                </td>
                <td class="py-2 px-3 text-right font-bold text-slate-800 dark:text-zinc-100">
                  {{ formatRupiah(b.net_cost) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Single Lot / Ringkasan Agregat Pembelian -->
        <div class="p-3.5 space-y-2 bg-slate-50/40 dark:bg-zinc-800/20 divide-y divide-slate-100 dark:divide-zinc-800">
          <div v-if="sale.buy_breakdown && sale.buy_breakdown.length === 1" class="flex items-center justify-between text-xs py-1">
            <span class="text-slate-500 dark:text-zinc-400">Tanggal Pembelian</span>
            <span class="font-semibold text-slate-700 dark:text-zinc-200">
              {{ sale.buy_breakdown[0]?.opened_at || '-' }}
            </span>
          </div>
          <div class="flex items-center justify-between text-xs py-1">
            <span class="text-slate-500 dark:text-zinc-400">Total Lot Dibeli</span>
            <span class="font-semibold text-slate-700 dark:text-zinc-200 tabular-nums">
              {{ sale.sold_lots }} Lot @ Rata-rata Rp {{ formatSharePrice(sale.buy_avg_price) }}
            </span>
          </div>
          <div class="flex items-center justify-between text-xs py-1">
            <span class="text-slate-500 dark:text-zinc-400">Total Beli Kotor</span>
            <span class="font-semibold text-slate-700 dark:text-zinc-200 tabular-nums">
              {{ formatRupiah(sale.buy_gross_cost) }}
            </span>
          </div>
          <div class="flex items-center justify-between text-xs py-1">
            <span class="text-slate-500 dark:text-zinc-400">Total Fee Beli (Komisi)</span>
            <span class="font-semibold text-slate-700 dark:text-zinc-200 tabular-nums">
              {{ formatRupiah(sale.buy_fee_total) }}
            </span>
          </div>
          <div class="flex items-center justify-between text-xs py-1.5 pt-2">
            <span class="font-bold text-slate-800 dark:text-zinc-200">Nilai Bersih Beli (Modal)</span>
            <span class="font-black text-[#144229] dark:text-[#a1d2af] text-sm tabular-nums">
              {{ formatRupiah(sale.buy_net_cost) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 3. Rincian Penjualan (Proceeds) -->
      <div class="rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-surface">
        <div class="px-4 py-3 bg-[#f9f9fc] dark:bg-zinc-800/40 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2 font-bold text-slate-800 dark:text-zinc-200">
            <ArrowUp class="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Rincian Penjualan (Hasil Bersih / Proceeds)</span>
          </div>
          <span class="text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums font-semibold">
            {{ sale.sold_at }}
          </span>
        </div>

        <div class="p-3.5 space-y-2 divide-y divide-slate-100 dark:divide-zinc-800">
          <div class="flex items-center justify-between text-xs py-1">
            <span class="text-slate-500 dark:text-zinc-400">Jumlah Lot Dijual</span>
            <span class="font-semibold text-slate-700 dark:text-zinc-200 tabular-nums">
              {{ sale.sold_lots }} Lot @ Rp {{ formatSharePrice(sale.sell_price) }}
            </span>
          </div>
          <div class="flex items-center justify-between text-xs py-1">
            <span class="text-slate-500 dark:text-zinc-400">Total Penjualan Kotor</span>
            <span class="font-semibold text-slate-700 dark:text-zinc-200 tabular-nums">
              {{ formatRupiah(sale.gross_proceeds) }}
            </span>
          </div>
          <div class="flex items-center justify-between text-xs py-1">
            <span class="text-slate-500 dark:text-zinc-400">Fee Jual (Komisi & Pajak BEI)</span>
            <span class="font-semibold text-slate-700 dark:text-zinc-200 tabular-nums">
              -{{ formatRupiah(sale.sell_fee) }}
            </span>
          </div>
          <div class="flex items-center justify-between text-xs py-1">
            <div class="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
              <span>Biaya Bea Meterai Transaksi</span>
              <span v-if="sale.has_daily_stamp_duty" class="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                Harian > Rp 10 Jt
              </span>
            </div>
            <span class="font-semibold tabular-nums" :class="sale.has_daily_stamp_duty ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-zinc-400'">
              {{ sale.has_daily_stamp_duty ? formatRupiah(sale.daily_stamp_duty) : 'Rp 0' }}
            </span>
          </div>
          <div class="flex items-center justify-between text-xs py-1.5 pt-2">
            <span class="font-bold text-slate-800 dark:text-zinc-200">Total Penjualan Bersih (Masuk Kas)</span>
            <span class="font-black text-[#144229] dark:text-[#a1d2af] text-sm tabular-nums">
              {{ formatRupiah(sale.net_proceeds) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 4. Ringkasan Realized Amount (Jual Bersih - Beli Bersih) -->
      <div class="p-4 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800/50 border border-slate-200/90 dark:border-zinc-700/60 space-y-2">
        <div class="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
          <InfoCircle class="w-4 h-4 text-slate-500" />
          <span>Kalkulasi Realized P/L</span>
        </div>

        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-500 dark:text-zinc-400">Total Penjualan Bersih</span>
          <span class="font-bold tabular-nums text-slate-800 dark:text-zinc-100">
            +{{ formatRupiah(sale.net_proceeds) }}
          </span>
        </div>

        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-500 dark:text-zinc-400">Total Nilai Bersih Pembelian</span>
          <span class="font-bold tabular-nums text-slate-800 dark:text-zinc-100">
            -{{ formatRupiah(sale.buy_net_cost) }}
          </span>
        </div>

        <div class="border-t border-slate-200 dark:border-zinc-700 pt-2 flex items-center justify-between">
          <span class="font-extrabold text-xs text-slate-800 dark:text-zinc-100">
            Realized Amount (Net P/L)
          </span>
          <div class="text-right">
            <span
              class="font-black text-base tabular-nums"
              :class="plColor(sale.realized_pl)"
            >
              {{ formatRupiah(sale.realized_pl, { withSign: true }) }}
            </span>
            <span class="ml-1.5 text-xs font-bold" :class="plColor(sale.realized_pl)">
              ({{ formatPercent(sale.realized_pl_percent) }})
            </span>
          </div>
        </div>
      </div>

      <!-- Catatan Tambahan (jika ada) -->
      <div v-if="sale.notes" class="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/30 text-xs text-slate-600 dark:text-zinc-400">
        <span class="font-bold text-slate-700 dark:text-zinc-300">Catatan:</span> {{ sale.notes }}
      </div>

      <!-- Footer Buttons -->
      <div class="flex items-center justify-between pt-2">
        <button
          type="button"
          @click="handleDeleteClick"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        >
          <Trash class="w-4 h-4" />
          <span>Batalkan Penjualan Ini</span>
        </button>

        <SecondaryButton type="button" size="md" @click="emit('close')">
          Tutup
        </SecondaryButton>
      </div>
    </div>
  </BottomSheet>
</template>
