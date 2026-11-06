<script setup>
import {
  NavArrowDown,
  NavArrowUp,
  Plus,
  EditPencil,
  CheckCircle,
  Calendar,
} from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import StockAvatar from '@/components/ui/StockAvatar.vue'
import {
  formatRupiah,
  formatCompactRupiah,
  formatSharePrice,
  formatPercent,
} from '@/utils/currencyUtils'

const props = defineProps({
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

function plBadgeBg(val) {
  const num = Number(val || 0)
  if (num > 0) return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/50'
  if (num < 0) return 'bg-rose-50 dark:bg-rose-950/60 text-[#ba1a1a] dark:text-rose-300 border-rose-200/70 dark:border-rose-800/50'
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
    class="overflow-hidden transition-all duration-200"
    :class="
      expanded
        ? 'ring-2 ring-[#144229]/25 dark:ring-[#a1d2af]/30 border-[#144229]/40 dark:border-[#a1d2af]/40'
        : 'hover:border-slate-300 dark:hover:border-zinc-700'
    "
  >
    <!-- ================= BAGIAN ATAS: RINGKASAN EMITEN (CLICK TO EXPAND) ================= -->
    <div
      role="button"
      tabindex="0"
      @click="emit('toggle-expand', stock.id)"
      @keydown.enter.prevent="emit('toggle-expand', stock.id)"
      class="p-4 sm:p-5 cursor-pointer select-none hover:bg-[#f9f9fc]/80 dark:hover:bg-zinc-800/30 transition-colors"
    >
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
        <!-- Kiri: Logo Emiten + Bendera ID + Simbol + Nama + Highlight "BBCA 10 Lot x 5.100 (avg)" -->
        <div class="flex items-start gap-3.5 min-w-0">
          <!-- Avatar Logo Saham (Ina Sekuritas / Fallback Inisial Hijau) -->
          <StockAvatar
            :ticker="stock.ticker"
            :alt="stock.company_name"
            size="lg"
            class="mt-0.5"
          />

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <!-- Bendera Merah Putih Mini seperti gambar referensi -->
              <span class="inline-flex flex-col w-4 h-3 rounded-[2px] overflow-hidden border border-slate-300 dark:border-zinc-600 shrink-0" title="Bursa Efek Indonesia (IDX)">
                <span class="h-1.5 bg-red-600 block" />
                <span class="h-1.5 bg-white block" />
              </span>

              <span class="text-base font-extrabold text-[#144229] dark:text-[#a1d2af] tracking-tight">
                {{ stock.ticker }}
              </span>

              <span class="text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-200 truncate max-w-[200px] sm:max-w-xs">
                {{ stock.company_name }}
              </span>

              <BaseBadge variant="emerald" size="xs">
                Beli · {{ stock.lots_count }}x transaksi
              </BaseBadge>
            </div>

            <!-- Rumus Ringkasan Utama sesuai permintaan user: BBCA 10 lot x 5.100 (avg harga) -->
            <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#f3f3f6] dark:bg-zinc-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 tabular-nums">
                <span>{{ stock.ticker }}</span>
                <span class="text-[#144229] dark:text-[#a1d2af]">{{ stock.total_lots }} Lot</span>
                <span class="text-slate-400">×</span>
                <span>Rp {{ formatSharePrice(stock.avg_buy_price) }}</span>
                <span class="text-[11px] font-medium text-slate-500 dark:text-zinc-400">(avg)</span>
              </div>

              <span class="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
                ({{ stock.total_shares.toLocaleString('id-ID') }} lembar · Modal {{ formatRupiah(stock.total_cost) }})
              </span>
            </div>
          </div>
        </div>

        <!-- Kanan: Grid Kolom ala Sekuritas (Jumlah, Avg, Hrg Skrg, Nilai Pasar, P/L Harian, P/L Bersih%, P/L Bersih) -->
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 items-center pt-2.5 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-zinc-800/80">
          <!-- Harga Rata-Rata -->
          <div class="text-left sm:text-right">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
              Harga Avg
            </span>
            <span class="text-xs sm:text-sm font-bold tabular-nums text-slate-800 dark:text-zinc-200">
              {{ formatSharePrice(stock.avg_buy_price, 2) }}
            </span>
          </div>

          <!-- Harga Sekarang (Yahoo Finance) -->
          <div class="text-left sm:text-right">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
              Hrg Skrg
            </span>
            <span class="text-xs sm:text-sm font-bold tabular-nums text-slate-900 dark:text-zinc-100">
              {{ formatSharePrice(stock.last_price, 2) }}
            </span>
          </div>

          <!-- Nilai Pasar -->
          <div class="text-right">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
              Nilai Pasar
            </span>
            <span class="text-xs sm:text-sm font-bold tabular-nums text-slate-900 dark:text-zinc-100" :title="formatRupiah(stock.market_value)">
              {{ formatCompactRupiah(stock.market_value) }}
            </span>
          </div>

          <!-- P/L Harian -->
          <div class="text-left sm:text-right">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
              P/L Harian
            </span>
            <span class="text-xs sm:text-sm font-bold tabular-nums" :class="plColor(stock.daily_pl)">
              {{ formatCompactRupiah(stock.daily_pl, { withSign: true }) }}
            </span>
          </div>

          <!-- P/L Bersih % -->
          <div class="text-left sm:text-right">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
              P/L Bersih%
            </span>
            <span class="text-xs sm:text-sm font-extrabold tabular-nums" :class="plColor(stock.net_pl_percent)">
              {{ formatPercent(stock.net_pl_percent) }}
            </span>
          </div>

          <!-- P/L Bersih (Rp) + Indikator Expand -->
          <div class="flex items-center justify-end gap-2">
            <div class="text-right">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                P/L Bersih
              </span>
              <span
                class="inline-block px-2 py-0.5 rounded-md text-xs sm:text-sm font-extrabold tabular-nums border"
                :class="plBadgeBg(stock.net_pl)"
                :title="formatRupiah(stock.net_pl, { withSign: true })"
              >
                {{ formatCompactRupiah(stock.net_pl, { withSign: true }) }}
              </span>
            </div>

            <div class="w-7 h-7 rounded-full bg-[#f3f3f6] dark:bg-zinc-800 flex items-center justify-center text-slate-500 shrink-0">
              <NavArrowUp v-if="expanded" class="w-4 h-4" />
              <NavArrowDown v-else class="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= BAGIAN BAWAH: DETAIL SETIAP PEMBELIAN (ACCORDION SEPERTI GAMBAR) ================= -->
    <div
      v-if="expanded"
      class="bg-[#f9f9fc] dark:bg-zinc-950/70 border-t border-[#e2e2e5] dark:border-zinc-800 px-4 py-4 sm:px-5 space-y-3"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
          Rincian Setiap Pembelian ({{ stock.ticker }})
        </p>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click.stop="emit('buy-more', stock.ticker)"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#144229] text-white hover:opacity-95 transition-opacity cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Tambah Lot {{ stock.ticker }}</span>
          </button>

          <button
            type="button"
            @click.stop="emit('close-all', stock)"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#d3e4d8] text-[#144229] dark:bg-[#2d5a3f] dark:text-[#a1d2af] hover:opacity-90 transition-opacity cursor-pointer"
          >
            <CheckCircle class="w-3.5 h-3.5" />
            <span>Jual Gabungan</span>
          </button>
        </div>
      </div>

      <!-- Tabel / Baris Pembelian ala Gambar Referensi -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr class="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-bold text-slate-600 dark:text-zinc-400">
              <th class="py-2 pr-3">Tanggal Pembukaan:</th>
              <th class="py-2 px-3">Jumlah:</th>
              <th class="py-2 px-3">Harga Pembukaan:</th>
              <th class="py-2 px-3">Total Komisi:</th>
              <th class="py-2 px-3">Nilai & P/L Lot Ini:</th>
              <th class="py-2 pl-3 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200/60 dark:divide-zinc-800/70 text-xs">
            <tr
              v-for="lot in stock.lots"
              :key="lot.id"
              class="hover:bg-white/70 dark:hover:bg-zinc-900/60 transition-colors"
            >
              <!-- Tanggal Pembukaan (Kotak bergaya input kalender seperti gambar) -->
              <td class="py-2.5 pr-3">
                <div class="inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 tabular-nums font-medium min-w-[125px]">
                  <span>{{ formatDateSlash(lot.opened_at) }}</span>
                  <Calendar class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              </td>

              <!-- Jumlah Lot & Lembar -->
              <td class="py-2.5 px-3">
                <div class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 tabular-nums font-bold min-w-[110px]">
                  <span>{{ lot.remaining_lots }} Lot</span>
                  <span class="text-[11px] font-normal text-slate-400">({{ lot.remaining_shares }} lbr)</span>
                </div>
              </td>

              <!-- Harga Pembukaan -->
              <td class="py-2.5 px-3">
                <div class="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 tabular-nums font-bold min-w-[100px]">
                  {{ formatSharePrice(lot.buy_price) }}
                </div>
              </td>

              <!-- Total Komisi -->
              <td class="py-2.5 px-3">
                <div class="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 tabular-nums min-w-[95px]">
                  {{ formatRupiah(lot.allocated_fee, { decimals: 2 }) }}
                </div>
              </td>

              <!-- P/L Lot Ini -->
              <td class="py-2.5 px-3 tabular-nums">
                <div class="font-bold text-slate-800 dark:text-zinc-200">
                  {{ formatRupiah(lot.market_value) }}
                </div>
                <div class="text-[11px] font-bold" :class="plColor(lot.net_pl)">
                  {{ formatRupiah(lot.net_pl, { withSign: true }) }} ({{ formatPercent(lot.net_pl_percent) }})
                </div>
              </td>

              <!-- Tindakan: Tutup Posisi | Edit Posisi -->
              <td class="py-2.5 pl-3 text-right whitespace-nowrap">
                <div class="inline-flex items-center gap-2">
                  <button
                    type="button"
                    @click.stop="emit('close-lot', { stock, lot })"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:text-[#144229] dark:hover:text-[#a1d2af] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all cursor-pointer"
                  >
                    <CheckCircle class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Tutup Posisi</span>
                  </button>

                  <span class="text-slate-300 dark:text-zinc-700">|</span>

                  <button
                    type="button"
                    @click.stop="emit('edit-lot', { stock, lot })"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                  >
                    <EditPencil class="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit posisi</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </BaseCard>
</template>
