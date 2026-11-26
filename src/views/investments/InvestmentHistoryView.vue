<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CheckCircle,
  Trash,
} from '@iconoir/vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StockAvatar from '@/components/ui/StockAvatar.vue'
import InvestmentHistoryMetrics from '@/components/modules/investments/InvestmentHistoryMetrics.vue'
import InvestmentSaleSwipeItem from '@/components/modules/investments/InvestmentSaleSwipeItem.vue'
import InvestmentDeleteSaleModal from '@/components/modules/investments/InvestmentDeleteSaleModal.vue'
import InvestmentSaleDetailSheet from '@/components/modules/investments/InvestmentSaleDetailSheet.vue'
import InvestmentRealizedStockSummary from '@/components/modules/investments/InvestmentRealizedStockSummary.vue'
import { useInvestmentStore } from '@/stores/investmentStore'
import {
  formatRupiah,
  formatSharePrice,
  formatPercent,
} from '@/utils/currencyUtils'

const investmentStore = useInvestmentStore()
const route = useRoute()
const router = useRouter()

// Tab filter aktif: 'sales' (Semua Transaksi) | 'summary' (Ringkasan per Saham)
const activeTab = ref('sales')

const tabs = [
  { id: 'sales', label: 'Semua Transaksi' },
  { id: 'summary', label: 'Ringkasan per Saham' },
]

watch(
  () => route.query.tab,
  (tab) => {
    if (tab === 'summary') {
      activeTab.value = 'summary'
    } else {
      activeTab.value = 'sales'
    }
  },
  { immediate: true }
)

function selectTab(tabId) {
  activeTab.value = tabId
  if (tabId === 'sales') {
    router.replace({ query: {} })
  } else {
    router.replace({ query: { tab: tabId } })
  }
}

function plColor(val) {
  const num = Number(val || 0)
  if (num > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (num < 0) return 'text-[#ba1a1a] dark:text-rose-400'
  return 'text-slate-600 dark:text-zinc-400'
}

// Modal Konfirmasi Hapus Transaksi Penjualan
const isDeleteSaleModalOpen = ref(false)
const selectedSaleForDelete = ref(null)
const isDeletingSale = ref(false)
const deleteSaleError = ref('')

function openDeleteSaleConfirm(sale) {
  selectedSaleForDelete.value = sale
  deleteSaleError.value = ''
  isDeleteSaleModalOpen.value = true
}

function closeDeleteSaleConfirm() {
  if (isDeletingSale.value) return
  isDeleteSaleModalOpen.value = false
  selectedSaleForDelete.value = null
  deleteSaleError.value = ''
}

// Bottom Sheet Rincian Penjualan
const isSaleDetailSheetOpen = ref(false)
const selectedSaleForDetail = ref(null)

function openSaleDetail(sale) {
  selectedSaleForDetail.value = sale
  isSaleDetailSheetOpen.value = true
}

function closeSaleDetail() {
  isSaleDetailSheetOpen.value = false
  selectedSaleForDetail.value = null
}

function handleDeleteFromDetail(sale) {
  closeSaleDetail()
  openDeleteSaleConfirm(sale)
}

async function handleConfirmDeleteSale(saleId) {
  isDeletingSale.value = true
  deleteSaleError.value = ''
  try {
    const res = await investmentStore.submitDeleteSale(saleId)
    if (res?.success) {
      closeDeleteSaleConfirm()
    } else {
      deleteSaleError.value = res?.message || 'Gagal membatalkan transaksi penjualan.'
    }
  } catch (err) {
    deleteSaleError.value = err?.message || 'Terjadi kesalahan sistem.'
  } finally {
    isDeletingSale.value = false
  }
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
        <BaseHeading as="h2" size="xl" weight="semibold">Riwayat Penjualan & Realized P/L</BaseHeading>
        <BaseText size="sm" variant="muted" class="mt-0.5">
          Tinjau seluruh posisi yang telah direalisasikan (Win/Loss) dan analisis performa per emiten saham.
        </BaseText>
      </div>
    </div>

    <!-- Metrik Ringkasan Riwayat (Realized P/L, Win/Loss, Max Win/Loss, Today) -->
    <InvestmentHistoryMetrics
      :metrics="investmentStore.realizedMetrics"
      :is-masked="investmentStore.isBalanceMasked"
      @toggle-privacy="investmentStore.toggleBalanceMask()"
    />

    <!-- Tab Switcher (Sesuai Gaya Pill di Habit) -->
    <div class="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3">
      <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          @click="selectTab(tab.id)"
          class="px-4 py-2 rounded-full text-xs font-semibold sm:font-bold transition-all cursor-pointer shrink-0 inline-flex items-center"
          :class="
            activeTab === tab.id
              ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-xs'
              : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-[#e2e2e5] dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700'
          "
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Area Data Tab: Transisi Fade Halus 150ms -->
    <Transition name="tab-fade" mode="out-in">
      <!-- ================= KONTEN SUB-TAB 1: REALIZED P/L (TRANSAKSI JUAL) ================= -->
      <div v-if="activeTab === 'sales'" key="sales" class="space-y-3.5">
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
          <BaseHeading as="h3" size="md" weight="semibold">Belum ada posisi yang ditutup</BaseHeading>
          <BaseText size="xs" variant="muted" class="mt-1">
            Riwayat realized P/L dan rasio win/loss akan tercatat otomatis saat kamu melakukan penjualan saham.
          </BaseText>
        </BaseCard>

        <template v-else>
          <!-- Mobile: Swipe Items -->
          <BaseCard padding="p-0" class="md:hidden overflow-hidden">
            <TransitionGroup
              tag="div"
              name="fade"
              class="divide-y divide-slate-200/70 dark:divide-zinc-800"
            >
              <InvestmentSaleSwipeItem
                v-for="sale in investmentStore.sales"
                :key="sale.id"
                :sale="sale"
                @click="openSaleDetail"
                @delete="openDeleteSaleConfirm"
              />
            </TransitionGroup>
          </BaseCard>

          <!-- Desktop: Tabel Lengkap -->
          <BaseCard padding="p-0" class="hidden md:block overflow-hidden shadow-2xs">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-200 dark:border-zinc-800 bg-[#f3f3f6]/60 dark:bg-zinc-800/50 text-[11px] font-bold text-slate-600 dark:text-zinc-400">
                  <th class="py-3 px-4">Tanggal Jual</th>
                  <th class="py-3 px-4">Emiten</th>
                  <th class="py-3 px-4 text-right">Lot Terjual</th>
                  <th class="py-3 px-4 text-right">Harga Modal</th>
                  <th class="py-3 px-4 text-right">Harga Jual</th>
                  <th class="py-3 px-4 text-right">Hasil Bersih</th>
                  <th class="py-3 px-4 text-right">Realized P/L</th>
                  <th class="py-3 px-4 text-center w-16">Aksi</th>
                </tr>
              </thead>
              <TransitionGroup
                tag="tbody"
                name="fade"
                class="divide-y divide-slate-200/70 dark:divide-zinc-800 text-xs tabular-nums"
              >
                <tr
                  v-for="sale in investmentStore.sales"
                  :key="sale.id"
                  @click="openSaleDetail(sale)"
                  class="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                >
                  <td class="py-3 px-4 text-slate-600 dark:text-zinc-300">{{ sale.sold_at }}</td>
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-2.5">
                      <StockAvatar :ticker="sale.ticker" :alt="sale.company_name" size="sm" />
                      <span class="font-extrabold text-[#144229] dark:text-[#a1d2af]">{{ sale.ticker }}</span>
                      <span class="text-slate-500 truncate max-w-[200px]">{{ sale.company_name }}</span>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-right font-bold">{{ sale.sold_lots }} ({{ sale.sold_shares }} lbr)</td>
                  <td class="py-3 px-4 text-right text-slate-600 dark:text-zinc-300">Rp {{ formatSharePrice(sale.buy_avg_price) }}</td>
                  <td class="py-3 px-4 text-right font-bold text-slate-900 dark:text-zinc-100">Rp {{ formatSharePrice(sale.sell_price) }}</td>
                  <td class="py-3 px-4 text-right font-semibold">{{ formatRupiah(sale.net_proceeds) }}</td>
                  <td class="py-3 px-4 text-right font-extrabold" :class="plColor(sale.realized_pl)">
                    {{ formatRupiah(sale.realized_pl, { withSign: true }) }} ({{ formatPercent(sale.realized_pl_percent) }})
                  </td>
                  <td class="py-3 px-4 text-center">
                    <button
                      type="button"
                      @click.stop="openDeleteSaleConfirm(sale)"
                      title="Batalkan Penjualan"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </TransitionGroup>
            </table>
          </BaseCard>
        </template>
      </div>

      <!-- ================= KONTEN SUB-TAB 2: SUMMARY REALIZE PER SAHAM ================= -->
      <div v-else key="summary" class="space-y-3.5">
        <InvestmentRealizedStockSummary :sales="investmentStore.sales" />
      </div>
    </Transition>

    <!-- Modal Konfirmasi: Batalkan Penjualan -->
    <InvestmentDeleteSaleModal
      :show="isDeleteSaleModalOpen"
      :sale="selectedSaleForDelete"
      :deleting="isDeletingSale"
      :error-message="deleteSaleError"
      @close="closeDeleteSaleConfirm"
      @confirm="handleConfirmDeleteSale"
    />

    <!-- Bottom Sheet: Rincian Transaksi Penjualan -->
    <InvestmentSaleDetailSheet
      :show="isSaleDetailSheetOpen"
      :sale="selectedSaleForDetail"
      @close="closeSaleDetail"
      @delete="handleDeleteFromDetail"
    />
  </div>
</template>

<style scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.15s ease-out;
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}
</style>

<style scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.15s ease-out;
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}
</style>
