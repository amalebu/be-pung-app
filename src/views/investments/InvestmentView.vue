<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { RefreshDouble, Search, Xmark, GraphUp, CheckCircle, Wallet } from '@iconoir/vue'
import AppShell from '@/components/layout/AppShell.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import StockAvatar from '@/components/ui/StockAvatar.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import InvestmentSummaryHeader from '@/components/modules/investments/InvestmentSummaryHeader.vue'
import StockAllocationChart from '@/components/modules/investments/StockAllocationChart.vue'
import InvestmentStockCard from '@/components/modules/investments/InvestmentStockCard.vue'
import InvestmentEditLotSheet from '@/components/modules/investments/InvestmentEditLotSheet.vue'
import InvestmentClosePositionSheet from '@/components/modules/investments/InvestmentClosePositionSheet.vue'
import InvestmentCashSheet from '@/components/modules/investments/InvestmentCashSheet.vue'
import { useInvestmentStore } from '@/stores/investmentStore'
import {
  formatRupiah,
  formatSharePrice,
  formatPercent,
} from '@/utils/currencyUtils'

const investmentStore = useInvestmentStore()
const route = useRoute()

const tabs = [
  { id: 'holdings', label: 'Saham' },
  { id: 'sales', label: 'Riwayat' },
  { id: 'cash', label: 'Cash' },
]

const searchOpen = ref(false)

function closeSearch() {
  investmentStore.searchQuery = ''
  searchOpen.value = false
}

function plColor(val) {
  const num = Number(val || 0)
  if (num > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (num < 0) return 'text-[#ba1a1a] dark:text-rose-400'
  return 'text-slate-600 dark:text-zinc-400'
}

watch(
  () => route.query.tab,
  (tab) => {
    if (tab && ['holdings', 'sales', 'cash'].includes(String(tab))) {
      investmentStore.activeTab = String(tab)
    } else {
      investmentStore.activeTab = 'holdings'
    }
  },
  { immediate: true }
)

function handleEditLot({ stock, lot }) {
  investmentStore.openEditLotSheet(lot, stock)
}

function handleCloseLot({ stock, lot }) {
  investmentStore.openClosePositionSheet({ stock, lot })
}

function handleCloseAllStock(stock) {
  investmentStore.openClosePositionSheet({ stock, lot: null })
}

async function handleSaveEditLot({ lotId, payload }) {
  await investmentStore.submitUpdateLot(lotId, payload)
}

async function handleDeleteLot(lotId) {
  await investmentStore.submitDeleteLot(lotId)
}

async function handleConfirmClosePosition(payload) {
  await investmentStore.submitClosePosition(payload)
}

async function handleConfirmCashAdjustment(payload) {
  await investmentStore.submitCashAdjustment(payload)
}

function handleSelectTickerFromChart(ticker) {
  if (!ticker || ticker === 'Lainnya') return
  investmentStore.activeTab = 'holdings'
  investmentStore.searchQuery = ticker
  searchOpen.value = true
}

onMounted(() => {
  investmentStore.fetchPortfolio(false)
})
</script>

<template>
  <AppShell>
    <div class="space-y-3.5 md:space-y-5">
      <!-- Judul: hanya desktop -->
      <div class="hidden md:block">
        <BaseHeading as="h2" size="xl" weight="semibold">Investment Portfolio & Saham BEI</BaseHeading>
        <BaseText size="sm" variant="muted" class="mt-0.5">
          Pantau posisi Cash RDN, rata-rata harga beli per lot, rincian setiap pembelian, dan harga pasar Yahoo Finance.
        </BaseText>
      </div>

      <!-- Ringkasan & Proporsi Saham (Desktop: Berdampingan, Mobile: Stacked) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-stretch">
        <div class="lg:col-span-7 flex flex-col justify-between">
          <InvestmentSummaryHeader
            :summary="investmentStore.summary"
            :is-masked="investmentStore.isBalanceMasked"
            @toggle-privacy="investmentStore.toggleBalanceMask()"
            @open-cash="(mode) => investmentStore.openCashSheet(mode)"
          />
        </div>
        <div class="lg:col-span-5 flex">
          <StockAllocationChart
            class="flex-1"
            :stocks="investmentStore.stocks"
            :total-market-value="investmentStore.summary.stock_market_value"
            :is-masked="investmentStore.isBalanceMasked"
            @select-ticker="handleSelectTickerFromChart"
            @buy="investmentStore.openBuySheet()"
          />
        </div>
      </div>

      <!-- Toolbar: Tab + Cari + Refresh -->
      <div class="flex items-center gap-2">
        <template v-if="!searchOpen">
          <div class="flex items-center gap-1.5 flex-1 min-w-0">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              @click="investmentStore.activeTab = tab.id"
              class="px-4 h-9 rounded-full text-xs font-bold transition-all cursor-pointer"
              :class="
                investmentStore.activeTab === tab.id
                  ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110]'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-[#e2e2e5] dark:border-zinc-800'
              "
            >
              {{ tab.label }}
            </button>
          </div>

          <button
            v-if="investmentStore.activeTab === 'holdings'"
            type="button"
            @click="searchOpen = true"
            class="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 text-slate-600 dark:text-zinc-300 cursor-pointer"
            aria-label="Cari saham"
          >
            <Search class="w-4 h-4" />
          </button>

          <button
            type="button"
            :disabled="investmentStore.refreshingPrices"
            @click="investmentStore.refreshMarketPrices()"
            class="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 text-slate-600 dark:text-zinc-300 cursor-pointer disabled:opacity-60"
            aria-label="Refresh harga"
          >
            <RefreshDouble
              class="w-4 h-4"
              :class="{ 'animate-spin': investmentStore.refreshingPrices }"
            />
          </button>
        </template>

        <div v-else class="relative flex-1">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="investmentStore.searchQuery"
            type="text"
            autofocus
            placeholder="Cari kode / nama saham..."
            class="w-full h-9 pl-9 pr-9 rounded-full text-sm bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-[#144229]"
          />
          <button
            type="button"
            @click="closeSearch"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 cursor-pointer"
            aria-label="Tutup pencarian"
          >
            <Xmark class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- ================= TAB: SAHAM ================= -->
      <template v-if="investmentStore.activeTab === 'holdings'">
        <div
          v-if="investmentStore.loading && investmentStore.stocks.length === 0"
          class="space-y-3"
        >
          <div
            v-for="n in 3"
            :key="n"
            class="h-16 rounded-2xl border border-[#e2e2e5] dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse"
          />
        </div>

        <BaseCard
          v-else-if="investmentStore.filteredStocks.length === 0"
          padding="p-8"
          class="text-center"
        >
          <div class="w-12 h-12 rounded-2xl bg-[#d3e4d8]/60 dark:bg-[#2d5a3f]/50 text-[#144229] dark:text-[#a1d2af] flex items-center justify-center mx-auto mb-3">
            <GraphUp class="w-6 h-6" />
          </div>
          <BaseHeading as="h3" size="md" weight="semibold">
            {{ investmentStore.searchQuery ? 'Saham tidak ditemukan' : 'Belum ada saham' }}
          </BaseHeading>
          <BaseText v-if="!investmentStore.searchQuery" size="xs" variant="muted" class="mt-1">
            Catat pembelian pertamamu untuk melihat harga rata-rata otomatis.
          </BaseText>
          <PrimaryButton
            v-if="!investmentStore.searchQuery"
            size="md"
            class="mt-4"
            @click="investmentStore.openBuySheet()"
          >
            Beli Saham Pertama
          </PrimaryButton>
        </BaseCard>

        <TransitionGroup
          v-else
          tag="div"
          name="list"
          class="space-y-2.5 relative"
        >
          <InvestmentStockCard
            v-for="stock in investmentStore.filteredStocks"
            :key="stock.id"
            :stock="stock"
            :expanded="investmentStore.isStockExpanded(stock.id)"
            @toggle-expand="investmentStore.toggleExpandStock"
            @buy-more="(ticker) => investmentStore.openBuySheet(ticker)"
            @edit-lot="handleEditLot"
            @close-lot="handleCloseLot"
            @close-all="handleCloseAllStock"
          />
        </TransitionGroup>
      </template>

      <!-- ================= TAB: RIWAYAT JUAL ================= -->
      <template v-else-if="investmentStore.activeTab === 'sales'">
        <div
          v-if="investmentStore.loading && investmentStore.sales.length === 0"
          class="space-y-3"
        >
          <div
            v-for="n in 3"
            :key="n"
            class="h-16 rounded-2xl border border-[#e2e2e5] dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse"
          />
        </div>

        <BaseCard v-else-if="investmentStore.sales.length === 0" padding="p-8" class="text-center">
          <CheckCircle class="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
          <BaseText size="sm" variant="muted">Belum ada posisi yang ditutup.</BaseText>
        </BaseCard>

        <BaseCard v-else padding="p-0" class="md:hidden overflow-hidden">
          <TransitionGroup
            tag="div"
            name="fade"
            class="divide-y divide-slate-200/70 dark:divide-zinc-800"
          >
            <div
              v-for="sale in investmentStore.sales"
              :key="sale.id"
              class="flex items-center gap-3 px-3.5 py-3"
            >
              <StockAvatar :ticker="sale.ticker" :alt="sale.company_name" size="md" class="shrink-0" />
              <div class="min-w-0 flex-1 text-xs tabular-nums">
                <div class="font-extrabold text-sm text-[#144229] dark:text-[#a1d2af]">
                  {{ sale.ticker }}
                  <span class="font-bold text-slate-700 dark:text-zinc-200 text-xs">· {{ sale.sold_lots }} Lot</span>
                </div>
                <div class="text-[11px] text-slate-500 dark:text-zinc-400">
                  {{ sale.sold_at }} · {{ formatSharePrice(sale.buy_avg_price) }} → {{ formatSharePrice(sale.sell_price) }}
                </div>
              </div>
              <div class="text-right text-xs tabular-nums shrink-0">
                <div class="font-extrabold" :class="plColor(sale.realized_pl)">
                  {{ formatRupiah(sale.realized_pl, { withSign: true }) }}
                </div>
                <div class="text-[11px] font-semibold" :class="plColor(sale.realized_pl)">
                  {{ formatPercent(sale.realized_pl_percent) }}
                </div>
              </div>
            </div>
          </TransitionGroup>
        </BaseCard>

        <!-- Desktop: tabel lengkap -->
        <BaseCard
          v-if="investmentStore.sales.length > 0"
          padding="p-0"
          class="hidden md:block overflow-hidden"
        >
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200 dark:border-zinc-800 bg-[#f3f3f6]/60 dark:bg-zinc-800/50 text-[11px] font-bold text-slate-600 dark:text-zinc-400">
                <th class="py-3 px-4">Tanggal Jual</th>
                <th class="py-3 px-4">Emiten</th>
                <th class="py-3 px-4 text-right">Lot</th>
                <th class="py-3 px-4 text-right">Avg Beli</th>
                <th class="py-3 px-4 text-right">Harga Jual</th>
                <th class="py-3 px-4 text-right">Hasil Bersih</th>
                <th class="py-3 px-4 text-right">Realized P/L</th>
              </tr>
            </thead>
            <TransitionGroup
              tag="tbody"
              name="fade"
              class="divide-y divide-slate-200/70 dark:divide-zinc-800 text-xs tabular-nums"
            >
              <tr v-for="sale in investmentStore.sales" :key="sale.id">
                <td class="py-3 px-4 text-slate-600 dark:text-zinc-300">{{ sale.sold_at }}</td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2.5">
                    <StockAvatar :ticker="sale.ticker" :alt="sale.company_name" size="sm" />
                    <span class="font-extrabold text-[#144229] dark:text-[#a1d2af]">{{ sale.ticker }}</span>
                    <span class="text-slate-500 truncate max-w-[200px]">{{ sale.company_name }}</span>
                  </div>
                </td>
                <td class="py-3 px-4 text-right font-bold">{{ sale.sold_lots }} ({{ sale.sold_shares }} lbr)</td>
                <td class="py-3 px-4 text-right">Rp {{ formatSharePrice(sale.buy_avg_price) }}</td>
                <td class="py-3 px-4 text-right font-bold">Rp {{ formatSharePrice(sale.sell_price) }}</td>
                <td class="py-3 px-4 text-right font-semibold">{{ formatRupiah(sale.net_proceeds) }}</td>
                <td class="py-3 px-4 text-right font-extrabold" :class="plColor(sale.realized_pl)">
                  {{ formatRupiah(sale.realized_pl, { withSign: true }) }} ({{ formatPercent(sale.realized_pl_percent) }})
                </td>
              </tr>
            </TransitionGroup>
          </table>
        </BaseCard>
      </template>

      <!-- ================= TAB: MUTASI CASH ================= -->
      <template v-else>
        <div
          v-if="investmentStore.loading && (!investmentStore.cash.mutations || investmentStore.cash.mutations.length === 0)"
          class="space-y-3"
        >
          <div
            v-for="n in 3"
            :key="n"
            class="h-16 rounded-2xl border border-[#e2e2e5] dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse"
          />
        </div>

        <BaseCard
          v-else-if="!investmentStore.cash.mutations || investmentStore.cash.mutations.length === 0"
          padding="p-8"
          class="text-center"
        >
          <Wallet class="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
          <BaseText size="sm" variant="muted">Belum ada mutasi Cash RDN.</BaseText>
        </BaseCard>

        <BaseCard v-else padding="p-0" class="md:hidden overflow-hidden">
          <TransitionGroup
            tag="div"
            name="fade"
            class="divide-y divide-slate-200/70 dark:divide-zinc-800"
          >
            <div
              v-for="m in investmentStore.cash.mutations"
              :key="m.id"
              class="flex items-center gap-3 px-3.5 py-3"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <BaseBadge :variant="m.amount >= 0 ? 'emerald' : 'rose'" size="xs">
                    {{ m.type }}
                  </BaseBadge>
                  <span class="text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
                    {{ m.transacted_at }}
                  </span>
                </div>
                <p
                  v-if="m.description"
                  class="mt-1 text-xs text-slate-700 dark:text-zinc-300 truncate"
                >
                  {{ m.description }}
                </p>
              </div>
              <div class="text-right text-xs tabular-nums shrink-0">
                <div class="font-extrabold" :class="plColor(m.amount)">
                  {{ formatRupiah(m.amount, { withSign: true }) }}
                </div>
                <div
                  class="text-[11px]"
                  :class="Number(m.balance_after) < 0 ? 'text-[#ba1a1a] dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-zinc-400'"
                >
                  Saldo {{ formatRupiah(m.balance_after) }}
                </div>
              </div>
            </div>
          </TransitionGroup>
        </BaseCard>

        <!-- Desktop: tabel lengkap -->
        <BaseCard
          v-if="investmentStore.cash.mutations && investmentStore.cash.mutations.length > 0"
          padding="p-0"
          class="hidden md:block overflow-hidden"
        >
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200 dark:border-zinc-800 bg-[#f3f3f6]/60 dark:bg-zinc-800/50 text-[11px] font-bold text-slate-600 dark:text-zinc-400">
                <th class="py-3 px-4">Tanggal</th>
                <th class="py-3 px-4">Tipe</th>
                <th class="py-3 px-4">Keterangan</th>
                <th class="py-3 px-4 text-right">Mutasi</th>
                <th class="py-3 px-4 text-right">Saldo Akhir</th>
              </tr>
            </thead>
            <TransitionGroup
              tag="tbody"
              name="fade"
              class="divide-y divide-slate-200/70 dark:divide-zinc-800 text-xs tabular-nums"
            >
              <tr v-for="m in investmentStore.cash.mutations" :key="m.id">
                <td class="py-3 px-4 text-slate-600 dark:text-zinc-300">{{ m.transacted_at }}</td>
                <td class="py-3 px-4">
                  <BaseBadge :variant="m.amount >= 0 ? 'emerald' : 'rose'" size="xs">{{ m.type }}</BaseBadge>
                </td>
                <td class="py-3 px-4 font-medium text-slate-800 dark:text-zinc-200">{{ m.description }}</td>
                <td class="py-3 px-4 text-right font-extrabold" :class="plColor(m.amount)">
                  {{ formatRupiah(m.amount, { withSign: true }) }}
                </td>
                <td
                  class="py-3 px-4 text-right"
                  :class="Number(m.balance_after) < 0 ? 'text-[#ba1a1a] dark:text-rose-400 font-extrabold' : 'text-slate-900 dark:text-zinc-100 font-bold'"
                >
                  {{ formatRupiah(m.balance_after) }}
                </td>
              </tr>
            </TransitionGroup>
          </table>
        </BaseCard>
      </template>
    </div>

    <!-- Bottom Sheet: Edit Posisi Lot -->
    <InvestmentEditLotSheet
      :show="investmentStore.isEditLotSheetOpen"
      :lot="investmentStore.editingLot"
      :saving="investmentStore.saving"
      :error-message="investmentStore.errorMessage"
      @close="investmentStore.closeEditLotSheet()"
      @submit="handleSaveEditLot"
      @delete="handleDeleteLot"
    />

    <!-- Bottom Sheet: Tutup Posisi (Jual Saham) -->
    <InvestmentClosePositionSheet
      :show="investmentStore.isClosePositionSheetOpen"
      :target="investmentStore.closingTarget"
      :saving="investmentStore.saving"
      :error-message="investmentStore.errorMessage"
      @close="investmentStore.closeClosePositionSheet()"
      @submit="handleConfirmClosePosition"
    />

    <!-- Bottom Sheet: Kelola Saldo Cash RDN -->
    <InvestmentCashSheet
      :show="investmentStore.isCashSheetOpen"
      :initial-mode="investmentStore.initialCashMode"
      :current-balance="investmentStore.summary.cash_balance"
      :saving="investmentStore.saving"
      :error-message="investmentStore.errorMessage"
      @close="investmentStore.closeCashSheet()"
      @submit="handleConfirmCashAdjustment"
    />
  </AppShell>
</template>
