<script setup>
import { onMounted, ref } from 'vue'
import { RefreshDouble, Search, Xmark, GraphUp } from '@iconoir/vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import InvestmentSummaryHeader from '@/components/modules/investments/InvestmentSummaryHeader.vue'
import StockAllocationChart from '@/components/modules/investments/StockAllocationChart.vue'
import InvestmentStockCard from '@/components/modules/investments/InvestmentStockCard.vue'
import InvestmentEditLotSheet from '@/components/modules/investments/InvestmentEditLotSheet.vue'
import InvestmentClosePositionSheet from '@/components/modules/investments/InvestmentClosePositionSheet.vue'
import InvestmentCashSheet from '@/components/modules/investments/InvestmentCashSheet.vue'
import { useInvestmentStore } from '@/stores/investmentStore'

const investmentStore = useInvestmentStore()
const searchOpen = ref(false)

function closeSearch() {
  investmentStore.searchQuery = ''
  searchOpen.value = false
}

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
  investmentStore.searchQuery = ticker
  searchOpen.value = true
}

onMounted(() => {
  investmentStore.fetchPortfolio(false)
})
</script>

<template>
  <div class="space-y-4 md:space-y-5">
    <!-- Judul Halaman Desktop -->
    <div class="hidden md:flex items-center justify-between">
      <div>
        <BaseHeading as="h2" size="xl" weight="semibold">Portofolio Saham BEI</BaseHeading>
        <BaseText size="sm" variant="muted" class="mt-0.5">
          Pantau posisi lot aktif, harga rata-rata beli, dan pergerakan pasar secara real-time.
        </BaseText>
      </div>

      <button
        type="button"
        :disabled="investmentStore.refreshingPrices"
        @click="investmentStore.refreshMarketPrices()"
        class="h-9 px-4 rounded-full flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
      >
        <RefreshDouble
          class="w-3.5 h-3.5 text-slate-500"
          :class="{ 'animate-spin': investmentStore.refreshingPrices }"
        />
        <span>{{ investmentStore.refreshingPrices ? 'Memperbarui...' : 'Update Harga' }}</span>
      </button>
    </div>

    <!-- Ringkasan Nilai & Alokasi Saham -->
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

    <!-- Toolbar Pencarian & Filter Mobile/Desktop -->
    <div class="flex items-center gap-2">
      <div v-if="!searchOpen" class="flex-1 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Daftar Kepemilikan ({{ investmentStore.stocks.length }})
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="searchOpen = true"
            class="h-9 px-3 rounded-full flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-semibold hover:border-slate-300 cursor-pointer shadow-2xs"
          >
            <Search class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Cari Saham</span>
          </button>

          <button
            type="button"
            :disabled="investmentStore.refreshingPrices"
            @click="investmentStore.refreshMarketPrices()"
            class="md:hidden w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 text-slate-600 dark:text-zinc-300 cursor-pointer disabled:opacity-60 shadow-2xs"
            aria-label="Refresh harga"
          >
            <RefreshDouble
              class="w-4 h-4"
              :class="{ 'animate-spin': investmentStore.refreshingPrices }"
            />
          </button>
        </div>
      </div>

      <div v-else class="relative flex-1">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          v-model="investmentStore.searchQuery"
          type="text"
          autofocus
          placeholder="Cari kode atau nama saham..."
          class="w-full h-9 pl-9 pr-9 rounded-full text-sm bg-white dark:bg-zinc-900 border border-[#144229] dark:border-[#a1d2af] text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none"
        />
        <button
          type="button"
          @click="closeSearch"
          class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
          aria-label="Tutup pencarian"
        >
          <Xmark class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- State Loading -->
    <div
      v-if="investmentStore.loading && investmentStore.stocks.length === 0"
      class="space-y-3"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="h-20 rounded-2xl border border-[#e2e2e5] dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse"
      />
    </div>

    <!-- State Kosong -->
    <BaseCard
      v-else-if="investmentStore.filteredStocks.length === 0"
      padding="p-8"
      class="text-center"
    >
      <div class="w-12 h-12 rounded-2xl bg-[#d3e4d8]/60 dark:bg-[#2d5a3f]/50 text-[#144229] dark:text-[#a1d2af] flex items-center justify-center mx-auto mb-3">
        <GraphUp class="w-6 h-6" />
      </div>
      <BaseHeading as="h3" size="md" weight="semibold">
        {{ investmentStore.searchQuery ? 'Saham tidak ditemukan' : 'Belum ada kepemilikan saham' }}
      </BaseHeading>
      <BaseText v-if="!investmentStore.searchQuery" size="xs" variant="muted" class="mt-1">
        Catat pembelian saham pertamamu untuk mulai menghitung return otomatis.
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

    <!-- State Berisi Data: List Kartu Saham -->
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
  </div>
</template>
