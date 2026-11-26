<script setup>
import { ref, computed } from 'vue'
import {
  Calendar,
  CheckCircle,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  RefreshDouble,
} from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import StockAvatar from '@/components/ui/StockAvatar.vue'
import {
  formatRupiah,
  formatSharePrice,
  formatPercent,
} from '@/utils/currencyUtils'

const props = defineProps({
  sales: {
    type: Array,
    default: () => [],
  },
})

// Pilihan Filter Tanggal: 'today', 'this_week', 'this_month', 'this_year', 'all', 'custom'
const datePreset = ref('all')
const dateFrom = ref('')
const dateTo = ref('')
const isCustomDateOpen = ref(false)

const datePresets = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'this_week', label: 'Minggu Ini' },
  { id: 'this_month', label: 'Bulan Ini' },
  { id: 'this_year', label: 'Tahun Ini' },
  { id: 'all', label: 'Semua' },
]

function selectPreset(presetId) {
  datePreset.value = presetId
  isCustomDateOpen.value = false
}

function toggleCustomDate() {
  datePreset.value = 'custom'
  isCustomDateOpen.value = !isCustomDateOpen.value
}

function plColor(val) {
  const num = Number(val || 0)
  if (num > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (num < 0) return 'text-[#ba1a1a] dark:text-rose-400'
  return 'text-slate-600 dark:text-zinc-400'
}

function plBg(val) {
  const num = Number(val || 0)
  if (num > 0) return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  if (num < 0) return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
  return 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
}

// Helper rentang tanggal
const dateRangeBounds = computed(() => {
  const now = new Date()
  const todayStr = now.toLocaleDateString('en-CA')

  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(new Date().setDate(diff))
  const startOfWeekStr = monday.toLocaleDateString('en-CA')

  const startOfMonthStr = todayStr.slice(0, 7) + '-01'
  const startOfYearStr = todayStr.slice(0, 4) + '-01-01'

  return {
    todayStr,
    startOfWeekStr,
    startOfMonthStr,
    startOfYearStr,
  }
})

// Filter transaksi berdasarkan rentang tanggal
const filteredSales = computed(() => {
  const allSales = props.sales || []
  const { todayStr, startOfWeekStr, startOfMonthStr, startOfYearStr } = dateRangeBounds.value

  return allSales.filter((sale) => {
    const saleDate = String(sale.sold_at || '').slice(0, 10)
    if (!saleDate) return false

    if (datePreset.value === 'today') {
      return saleDate === todayStr
    }
    if (datePreset.value === 'this_week') {
      return saleDate >= startOfWeekStr && saleDate <= todayStr
    }
    if (datePreset.value === 'this_month') {
      return saleDate >= startOfMonthStr && saleDate <= todayStr
    }
    if (datePreset.value === 'this_year') {
      return saleDate >= startOfYearStr && saleDate <= todayStr
    }
    if (datePreset.value === 'custom') {
      if (dateFrom.value && saleDate < dateFrom.value) return false
      if (dateTo.value && saleDate > dateTo.value) return false
      return true
    }

    return true // 'all'
  })
})

// Agregasi penjualan digabung per saham & diurutkan dari Realized P/L terbesar ke terkecil
const groupedStocks = computed(() => {
  const map = {}

  for (const sale of filteredSales.value) {
    const ticker = sale.ticker || 'UNKNOWN'
    if (!map[ticker]) {
      map[ticker] = {
        ticker,
        company_name: sale.company_name || ticker,
        total_lots: 0,
        total_shares: 0,
        total_net_proceeds: 0,
        total_realized_pl: 0,
        transactions_count: 0,
        weighted_buy_price_sum: 0,
        weighted_sell_price_sum: 0,
      }
    }

    const item = map[ticker]
    const lots = Number(sale.sold_lots || 0)
    const shares = Number(sale.sold_shares || lots * 100)
    const pl = Number(sale.realized_pl || 0)
    const netProceeds = Number(sale.net_proceeds || 0)
    const buyPrice = Number(sale.buy_avg_price || 0)
    const sellPrice = Number(sale.sell_price || 0)

    item.total_lots += lots
    item.total_shares += shares
    item.total_realized_pl += pl
    item.total_net_proceeds += netProceeds
    item.transactions_count += 1
    item.weighted_buy_price_sum += buyPrice * shares
    item.weighted_sell_price_sum += sellPrice * shares
  }

  const result = Object.values(map).map((item) => {
    const avgBuy = item.total_shares > 0 ? item.weighted_buy_price_sum / item.total_shares : 0
    const avgSell = item.total_shares > 0 ? item.weighted_sell_price_sum / item.total_shares : 0
    const costBasis = avgBuy * item.total_shares
    const plPercent = costBasis > 0 ? (item.total_realized_pl / costBasis) * 100 : 0

    return {
      ticker: item.ticker,
      company_name: item.company_name,
      total_lots: item.total_lots,
      total_shares: item.total_shares,
      total_realized_pl: item.total_realized_pl,
      total_realized_pl_percent: plPercent,
      total_net_proceeds: item.total_net_proceeds,
      avg_buy_price: Math.round(avgBuy),
      avg_sell_price: Math.round(avgSell),
      transactions_count: item.transactions_count,
    }
  })

  // Urutkan total realized saham dari yang paling besar ke paling kecil sesuai permintaan user
  result.sort((a, b) => b.total_realized_pl - a.total_realized_pl)

  return result
})

// Total ringkasan kecil untuk rentang yang difilter
const filterSummary = computed(() => {
  const list = groupedStocks.value
  const totalPL = list.reduce((sum, item) => sum + item.total_realized_pl, 0)
  const totalNet = list.reduce((sum, item) => sum + item.total_net_proceeds, 0)
  return {
    count: list.length,
    totalPL,
    totalNet,
  }
})
</script>

<template>
  <div class="space-y-3.5">
    <!-- BAR FILTER WAKTU (Today, This Week, This Month, This Year, All, Custom) -->
    <div class="space-y-2.5">
      <div class="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
        <!-- Preset Buttons -->
        <div class="flex items-center gap-1.5 sm:gap-2">
          <button
            v-for="p in datePresets"
            :key="p.id"
            type="button"
            @click="selectPreset(p.id)"
            class="px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0"
            :class="
              datePreset === p.id && !isCustomDateOpen
                ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-xs font-bold'
                : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-[#e2e2e5] dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700'
            "
          >
            {{ p.label }}
          </button>

          <!-- Tombol Custom Date -->
          <button
            type="button"
            @click="toggleCustomDate"
            class="px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border"
            :class="
              datePreset === 'custom' || isCustomDateOpen
                ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] border-transparent shadow-xs font-bold'
                : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-[#e2e2e5] dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700'
            "
          >
            <Calendar class="w-3.5 h-3.5" />
            <span>Kustom</span>
          </button>
        </div>

        <!-- Label Ringkasan Singkat -->
        <div class="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 shrink-0">
          <span>{{ filterSummary.count }} Emiten</span>
          <span>·</span>
          <span class="font-bold tabular-nums" :class="plColor(filterSummary.totalPL)">
            {{ formatRupiah(filterSummary.totalPL, { withSign: true }) }}
          </span>
        </div>
      </div>

      <!-- Popover / Baris Input Tanggal Kustom (Date From - Date To) -->
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div
          v-if="isCustomDateOpen"
          class="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-surface flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs"
        >
          <div class="flex items-center gap-2">
            <span class="font-semibold text-slate-600 dark:text-zinc-400">Dari:</span>
            <input
              type="date"
              v-model="dateFrom"
              class="h-8 px-2.5 rounded-xl border border-[#e2e2e5] dark:border-zinc-700 bg-[#f9f9fc] dark:bg-zinc-800 text-xs font-semibold tabular-nums text-slate-900 dark:text-zinc-100"
            />
          </div>

          <div class="flex items-center gap-2">
            <span class="font-semibold text-slate-600 dark:text-zinc-400">Sampai:</span>
            <input
              type="date"
              v-model="dateTo"
              class="h-8 px-2.5 rounded-xl border border-[#e2e2e5] dark:border-zinc-700 bg-[#f9f9fc] dark:bg-zinc-800 text-xs font-semibold tabular-nums text-slate-900 dark:text-zinc-100"
            />
          </div>

          <div class="flex items-center gap-2 ml-auto">
            <button
              v-if="dateFrom || dateTo"
              type="button"
              @click="dateFrom = ''; dateTo = ''"
              class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 underline cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- STATE KOSONG (JIKA TIDAK ADA PENJUALAN PADA PERIODE TERSEBUT) -->
    <BaseCard
      v-if="groupedStocks.length === 0"
      padding="p-8"
      class="text-center"
    >
      <CheckCircle class="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
      <BaseHeading as="h3" size="md" weight="semibold">Tidak ada realisasi penjualan</BaseHeading>
      <BaseText size="xs" variant="muted" class="mt-1 max-w-sm mx-auto">
        Tidak ada transaksi penjualan saham yang tercatat pada periode ini. Ubah filter tanggal di atas untuk melihat riwayat lainnya.
      </BaseText>
    </BaseCard>

    <template v-else>
      <!-- MOBILE VIEW: KARTU SUMMARY PER SAHAM -->
      <div class="space-y-2.5 md:hidden">
        <BaseCard
          v-for="stock in groupedStocks"
          :key="stock.ticker"
          padding="p-3.5 sm:p-4"
          class="space-y-3 shadow-xs"
        >
          <!-- Baris Atas: Avatar + Ticker + Badge Frekuensi + Realized P/L -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <StockAvatar :ticker="stock.ticker" :alt="stock.company_name" size="sm" />
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="font-extrabold text-[#144229] dark:text-[#a1d2af] text-sm">
                    {{ stock.ticker }}
                  </span>
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                    {{ stock.transactions_count }}x Jual
                  </span>
                </div>
                <span class="text-[11px] text-slate-400 dark:text-zinc-500 truncate block max-w-[160px]">
                  {{ stock.company_name }}
                </span>
              </div>
            </div>

            <!-- Total Realized P/L Badge -->
            <div class="text-right shrink-0">
              <div class="text-sm font-extrabold tabular-nums" :class="plColor(stock.total_realized_pl)">
                {{ formatRupiah(stock.total_realized_pl, { withSign: true }) }}
              </div>
              <div class="text-[11px] font-bold tabular-nums" :class="plColor(stock.total_realized_pl)">
                {{ formatPercent(stock.total_realized_pl_percent) }}
              </div>
            </div>
          </div>

          <!-- Baris Bawah: Detail Lot, Modal, Jual, dan Nilai Bersih -->
          <div class="pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 grid grid-cols-2 gap-2 text-xs tabular-nums">
            <div>
              <span class="text-[10px] text-slate-400 dark:text-zinc-500 block">Total Lot Terjual</span>
              <span class="font-bold text-slate-800 dark:text-zinc-200">
                {{ stock.total_lots }} Lot ({{ stock.total_shares }} lbr)
              </span>
            </div>

            <div class="text-right">
              <span class="text-[10px] text-slate-400 dark:text-zinc-500 block">Hasil Bersih (Net)</span>
              <span class="font-bold text-slate-800 dark:text-zinc-200">
                {{ formatRupiah(stock.total_net_proceeds) }}
              </span>
            </div>

            <div class="col-span-2 pt-1 flex justify-between items-center text-[11px] text-slate-500 dark:text-zinc-400 bg-[#f9f9fc] dark:bg-zinc-800/40 p-2 rounded-xl">
              <span>Avg Modal: <strong>Rp {{ formatSharePrice(stock.avg_buy_price) }}</strong></span>
              <span>&rarr;</span>
              <span>Avg Jual: <strong>Rp {{ formatSharePrice(stock.avg_sell_price) }}</strong></span>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- DESKTOP VIEW: TABEL LENGKAP SUMMARY REALIZE -->
      <BaseCard padding="p-0" class="hidden md:block overflow-hidden shadow-2xs">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 dark:border-zinc-800 bg-[#f3f3f6]/60 dark:bg-zinc-800/50 text-[11px] font-bold text-slate-600 dark:text-zinc-400">
              <th class="py-3 px-4">Emiten</th>
              <th class="py-3 px-4 text-center">Frekuensi</th>
              <th class="py-3 px-4 text-right">Total Terjual</th>
              <th class="py-3 px-4 text-right">Avg Modal</th>
              <th class="py-3 px-4 text-right">Avg Jual</th>
              <th class="py-3 px-4 text-right">Hasil Bersih</th>
              <th class="py-3 px-4 text-right">Total Realized P/L</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200/70 dark:divide-zinc-800 text-xs tabular-nums">
            <tr
              v-for="stock in groupedStocks"
              :key="stock.ticker"
              class="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
            >
              <!-- Emiten -->
              <td class="py-3 px-4">
                <div class="flex items-center gap-2.5">
                  <StockAvatar :ticker="stock.ticker" :alt="stock.company_name" size="sm" />
                  <div>
                    <span class="font-extrabold text-[#144229] dark:text-[#a1d2af] block">
                      {{ stock.ticker }}
                    </span>
                    <span class="text-slate-500 truncate max-w-[200px] block text-[11px]">
                      {{ stock.company_name }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Frekuensi -->
              <td class="py-3 px-4 text-center">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                  {{ stock.transactions_count }}x Transaksi
                </span>
              </td>

              <!-- Total Lot -->
              <td class="py-3 px-4 text-right font-bold text-slate-800 dark:text-zinc-200">
                {{ stock.total_lots }} Lot
                <span class="text-slate-400 font-normal block text-[10px]">
                  ({{ stock.total_shares }} lbr)
                </span>
              </td>

              <!-- Avg Modal -->
              <td class="py-3 px-4 text-right text-slate-600 dark:text-zinc-300">
                Rp {{ formatSharePrice(stock.avg_buy_price) }}
              </td>

              <!-- Avg Jual -->
              <td class="py-3 px-4 text-right font-bold text-slate-900 dark:text-zinc-100">
                Rp {{ formatSharePrice(stock.avg_sell_price) }}
              </td>

              <!-- Hasil Bersih -->
              <td class="py-3 px-4 text-right font-semibold text-slate-700 dark:text-zinc-300">
                {{ formatRupiah(stock.total_net_proceeds) }}
              </td>

              <!-- Total Realized P/L -->
              <td class="py-3 px-4 text-right font-extrabold" :class="plColor(stock.total_realized_pl)">
                <span class="block">
                  {{ formatRupiah(stock.total_realized_pl, { withSign: true }) }}
                </span>
                <span class="text-[11px] font-bold block">
                  ({{ formatPercent(stock.total_realized_pl_percent) }})
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </BaseCard>
    </template>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>