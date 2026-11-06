<script setup>
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Plus,
  RefreshDouble,
  Wallet,
  Search,
  Xmark,
  GraphUp,
  CheckCircle,
  Eye,
  EyeClosed,
} from '@iconoir/vue'
import AppShell from '@/components/layout/AppShell.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import StockAvatar from '@/components/ui/StockAvatar.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import SecondaryButton from '@/components/ui/SecondaryButton.vue'
import InvestmentSummaryHeader from '@/components/modules/investments/InvestmentSummaryHeader.vue'
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
  { id: 'holdings', label: 'Portofolio Saham Aktif' },
  { id: 'sales', label: 'Riwayat Tutup Posisi (Realized)' },
  { id: 'cash', label: 'Mutasi Cash RDN' },
]

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

onMounted(() => {
  investmentStore.fetchPortfolio(false)
})
</script>

<template>
  <AppShell>
    <div class="space-y-5">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <BaseHeading as="h2" size="xl" weight="semibold">
            Investment Portfolio & Saham BEI
          </BaseHeading>
          <BaseText size="sm" variant="muted" class="mt-0.5">
            Pantau posisi Cash RDN, rata-rata harga beli (Avg Price) per Lot, rincian setiap pembelian, dan harga pasar Yahoo Finance.
          </BaseText>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Privacy Toggle Button -->
          <SecondaryButton
            size="sm"
            @click="investmentStore.toggleBalanceMask()"
            :title="investmentStore.isBalanceMasked ? 'Tampilkan Nominal Saldo' : 'Sembunyikan Nominal Saldo'"
          >
            <component :is="investmentStore.isBalanceMasked ? EyeClosed : Eye" class="w-4 h-4" />
            <span class="hidden sm:inline">{{ investmentStore.isBalanceMasked ? 'Buka Saldo' : 'Tutup Saldo' }}</span>
          </SecondaryButton>

          <SecondaryButton
            size="sm"
            :disabled="investmentStore.refreshingPrices"
            @click="investmentStore.refreshMarketPrices()"
          >
            <RefreshDouble
              class="w-4 h-4"
              :class="{ 'animate-spin': investmentStore.refreshingPrices }"
            />
            <span>{{ investmentStore.refreshingPrices ? 'Memperbarui...' : 'Refresh Harga' }}</span>
          </SecondaryButton>

          <SecondaryButton
            size="sm"
            @click="investmentStore.openCashSheet('topup')"
          >
            <Wallet class="w-4 h-4" />
            <span>Cash RDN</span>
          </SecondaryButton>

          <PrimaryButton
            size="sm"
            @click="investmentStore.openBuySheet()"
          >
            <Plus class="w-4 h-4" />
            <span>+ Beli Saham</span>
          </PrimaryButton>
        </div>
      </div>

      <!-- Summary Banner (Total Portfolio + Cash RDN + 4 Metric Cards) -->
      <InvestmentSummaryHeader
        :summary="investmentStore.summary"
        :is-masked="investmentStore.isBalanceMasked"
        @toggle-privacy="investmentStore.toggleBalanceMask()"
        @open-cash="(mode) => investmentStore.openCashSheet(mode)"
        @open-buy="investmentStore.openBuySheet()"
      />

      <!-- Navigation Tabs & Search Filter -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            @click="investmentStore.activeTab = tab.id"
            class="px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0"
            :class="
              investmentStore.activeTab === tab.id
                ? 'bg-[#144229] text-white shadow-xs'
                : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-[#e2e2e5] dark:border-zinc-800 hover:bg-[#f3f3f6] dark:hover:bg-zinc-800'
            "
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-if="investmentStore.activeTab === 'holdings'" class="relative sm:w-64">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="investmentStore.searchQuery"
            type="text"
            placeholder="Cari kode / nama saham..."
            class="w-full pl-9 pr-8 py-2 rounded-full text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-[#144229]"
          />
          <button
            v-if="investmentStore.searchQuery"
            type="button"
            @click="investmentStore.searchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <Xmark class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- ================= TAB 1: PORTOFOLIO SAHAM AKTIF ================= -->
      <template v-if="investmentStore.activeTab === 'holdings'">
        <!-- Loading Skeleton -->
        <div
          v-if="investmentStore.loading && investmentStore.stocks.length === 0"
          class="space-y-3"
        >
          <div
            v-for="n in 3"
            :key="n"
            class="p-5 rounded-2xl border border-[#e2e2e5] dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse space-y-3"
          >
            <div class="h-5 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
            <div class="h-8 bg-slate-100 dark:bg-zinc-800/70 rounded" />
          </div>
        </div>

        <!-- Empty State -->
        <BaseCard
          v-else-if="investmentStore.filteredStocks.length === 0"
          padding="p-8 sm:p-10"
          class="text-center"
        >
          <div class="w-12 h-12 rounded-2xl bg-[#d3e4d8]/60 dark:bg-[#2d5a3f]/50 text-[#144229] dark:text-[#a1d2af] flex items-center justify-center mx-auto mb-3">
            <GraphUp class="w-6 h-6" />
          </div>
          <BaseHeading as="h3" size="md" weight="semibold">
            Belum Ada Posisi Saham Aktif
          </BaseHeading>
          <BaseText size="xs" variant="muted" class="mt-1 max-w-md mx-auto">
            Catat pembelian saham (misal BBCA 5 lot × 5.000 lalu 5 lot × 5.200) untuk melihat kalkulasi otomatis rata-rata harga (Avg Price) dan rincian setiap lot pembelian.
          </BaseText>
          <div class="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <PrimaryButton size="md" @click="investmentStore.openBuySheet()">
              <Plus class="w-4 h-4" />
              <span>Beli Saham Pertama</span>
            </PrimaryButton>
            <SecondaryButton size="md" @click="investmentStore.openCashSheet('topup')">
              <Wallet class="w-4 h-4" />
              <span>Top-Up Cash RDN</span>
            </SecondaryButton>
          </div>
        </BaseCard>

        <!-- Daftar Kartu Emiten Saham (Klik untuk Expand Detail Lot) -->
        <div v-else class="space-y-3">
          <div class="flex items-center justify-between px-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
            <span>Klik kartu saham untuk melihat rincian setiap pembelian, Edit Posisi, atau Tutup Posisi</span>
            <span class="tabular-nums">{{ investmentStore.filteredStocks.length }} emiten aktif</span>
          </div>

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
        </div>
      </template>

      <!-- ================= TAB 2: RIWAYAT TUTUP POSISI (REALIZED P/L) ================= -->
      <template v-else-if="investmentStore.activeTab === 'sales'">
        <BaseCard
          v-if="investmentStore.sales.length === 0"
          padding="p-8 text-center"
        >
          <CheckCircle class="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
          <BaseHeading as="h3" size="sm" weight="semibold">
            Belum Ada Riwayat Penutupan Posisi
          </BaseHeading>
          <BaseText size="xs" variant="muted" class="mt-1">
            Saat Anda menekan tombol "Tutup Posisi" pada rincian lot saham, histori keuntungan/kerugian bersih (Realized P/L) akan tercatat di sini.
          </BaseText>
        </BaseCard>

        <BaseCard v-else padding="p-0" class="overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr class="border-b border-slate-200 dark:border-zinc-800 bg-[#f3f3f6]/60 dark:bg-zinc-800/50 text-[11px] font-bold text-slate-600 dark:text-zinc-400">
                  <th class="py-3 px-4">Tanggal Jual</th>
                  <th class="py-3 px-4">Emiten</th>
                  <th class="py-3 px-4">Jumlah Lot</th>
                  <th class="py-3 px-4">Harga Beli Avg</th>
                  <th class="py-3 px-4">Harga Jual</th>
                  <th class="py-3 px-4">Hasil Bersih</th>
                  <th class="py-3 px-4 text-right">Realized P/L</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200/70 dark:divide-zinc-800 text-xs tabular-nums">
                <tr v-for="sale in investmentStore.sales" :key="sale.id">
                  <td class="py-3 px-4 font-medium text-slate-600 dark:text-zinc-300">
                    {{ sale.sold_at }}
                  </td>
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-2.5">
                      <StockAvatar :ticker="sale.ticker" :alt="sale.company_name" size="sm" />
                      <div class="min-w-0">
                        <span class="font-extrabold text-[#144229] dark:text-[#a1d2af]">{{ sale.ticker }}</span>
                        <span class="text-slate-500 ml-1.5 text-xs truncate">{{ sale.company_name }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4 font-bold">
                    {{ sale.sold_lots }} Lot ({{ sale.sold_shares }} lbr)
                  </td>
                  <td class="py-3 px-4">
                    Rp {{ formatSharePrice(sale.buy_avg_price) }}
                  </td>
                  <td class="py-3 px-4 font-bold">
                    Rp {{ formatSharePrice(sale.sell_price) }}
                  </td>
                  <td class="py-3 px-4 font-semibold">
                    {{ formatRupiah(sale.net_proceeds) }}
                  </td>
                  <td class="py-3 px-4 text-right font-extrabold">
                    <span
                      :class="
                        sale.realized_pl > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : sale.realized_pl < 0
                            ? 'text-[#ba1a1a] dark:text-rose-400'
                            : 'text-slate-600'
                      "
                    >
                      {{ formatRupiah(sale.realized_pl, { withSign: true }) }}
                      ({{ formatPercent(sale.realized_pl_percent) }})
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>
      </template>

      <!-- ================= TAB 3: MUTASI CASH RDN ================= -->
      <template v-else>
        <BaseCard
          v-if="!investmentStore.cash.mutations || investmentStore.cash.mutations.length === 0"
          padding="p-8 text-center"
        >
          <Wallet class="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
          <BaseHeading as="h3" size="sm" weight="semibold">
            Belum Ada Riwayat Mutasi Cash RDN
          </BaseHeading>
          <BaseText size="xs" variant="muted" class="mt-1">
            Silakan lakukan Top-Up saldo awal Cash RDN Anda untuk mulai mencatat arus dana investasi.
          </BaseText>
        </BaseCard>

        <BaseCard v-else padding="p-0" class="overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[540px]">
              <thead>
                <tr class="border-b border-slate-200 dark:border-zinc-800 bg-[#f3f3f6]/60 dark:bg-zinc-800/50 text-[11px] font-bold text-slate-600 dark:text-zinc-400">
                  <th class="py-3 px-4">Tanggal</th>
                  <th class="py-3 px-4">Tipe</th>
                  <th class="py-3 px-4">Keterangan</th>
                  <th class="py-3 px-4 text-right">Mutasi</th>
                  <th class="py-3 px-4 text-right">Saldo Akhir</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200/70 dark:divide-zinc-800 text-xs tabular-nums">
                <tr v-for="m in investmentStore.cash.mutations" :key="m.id">
                  <td class="py-3 px-4 text-slate-600 dark:text-zinc-300">
                    {{ m.transacted_at }}
                  </td>
                  <td class="py-3 px-4">
                    <BaseBadge
                      :variant="m.amount >= 0 ? 'emerald' : 'rose'"
                      size="xs"
                    >
                      {{ m.type }}
                    </BaseBadge>
                  </td>
                  <td class="py-3 px-4 font-medium text-slate-800 dark:text-zinc-200">
                    {{ m.description }}
                  </td>
                  <td
                    class="py-3 px-4 text-right font-extrabold"
                    :class="m.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#ba1a1a] dark:text-rose-400'"
                  >
                    {{ formatRupiah(m.amount, { withSign: true }) }}
                  </td>
                  <td
                    class="py-3 px-4 text-right tabular-nums"
                    :class="Number(m.balance_after) < 0 ? 'text-[#ba1a1a] dark:text-rose-400 font-extrabold' : 'text-slate-900 dark:text-zinc-100 font-bold'"
                  >
                    {{ formatRupiah(m.balance_after) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
