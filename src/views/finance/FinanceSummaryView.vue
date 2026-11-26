<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import {
  Wallet,
  Bank,
  CreditCard,
  Eye,
  EyeClosed,
  ArrowUpRight,
  ArrowDownRight,
  Shuffle,
  NavArrowRight,
  EditPencil,
  Trash,
  Search,
  Plus,
} from '@iconoir/vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import FinanceFeatureCarousel from '@/components/modules/finance/FinanceFeatureCarousel.vue'
import FinanceWeeklyConsistency from '@/components/modules/finance/FinanceWeeklyConsistency.vue'
import { getCategoryIcon } from '@/utils/categoryIcons'
import { formatCompactRupiah } from '@/utils/currencyUtils'
import { useFinanceStore } from '@/stores/financeStore'

ChartJS.register(ArcElement, Tooltip, Legend)

const router = useRouter()
const financeStore = useFinanceStore()

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(String(dateStr).replace(' ', 'T'))
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getWalletIcon(type) {
  if (type === 'bank') return Bank
  if (type === 'credit' || type === 'ewallet') return CreditCard
  return Wallet
}

function getWalletTypeLabel(type) {
  if (type === 'cash') return 'Tunai · IDR'
  if (type === 'bank') return 'Rekening Bank · IDR'
  if (type === 'ewallet') return 'E-Wallet · IDR'
  if (type === 'credit') return 'Kartu Kredit · IDR'
  return `${type || 'Dompet'} · IDR`
}

// ==========================================
// CHART PENGELUARAN BY CATEGORY
// ==========================================
const categoryBreakdown = computed(() => {
  if (financeStore.statistics?.category_breakdown?.length) {
    return financeStore.statistics.category_breakdown
  }
  // Fallback hitung langsung dari daftar transaksi periode aktif jika statistics belum terisi
  const txList = financeStore.transactions?.length
    ? financeStore.transactions
    : financeStore.recentTransactions
  const expenses = (txList || []).filter((t) => t.type === 'expense')
  const totalExp = expenses.reduce((s, t) => s + Number(t.amount || 0), 0)
  if (totalExp <= 0) return []

  const groups = new Map()
  for (const tx of expenses) {
    const key = tx.finance_category_id || 'uncat'
    if (!groups.has(key)) {
      groups.set(key, {
        category_id: tx.finance_category_id,
        category_name: tx.category?.name || 'Uncategorized',
        color: tx.category?.color || '#144229',
        icon: tx.category?.icon || 'help',
        total: 0,
      })
    }
    groups.get(key).total += Number(tx.amount || 0)
  }

  return Array.from(groups.values())
    .map((g) => ({
      ...g,
      percentage: Math.round((g.total / totalExp) * 1000) / 10,
    }))
    .sort((a, b) => b.total - a.total)
})

const doughnutChartData = computed(() => ({
  labels: categoryBreakdown.value.map((c) => c.category_name),
  datasets: [
    {
      data: categoryBreakdown.value.map((c) => c.total),
      backgroundColor: categoryBreakdown.value.map((c) => c.color || '#144229'),
      borderWidth: 2,
      borderColor: 'transparent',
      hoverOffset: 6,
    },
  ],
}))

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label(ctx) {
          return `${ctx.label}: ${formatCompactRupiah(ctx.parsed)}`
        },
      },
    },
  },
}

// ==========================================
// KONFIRMASI BAYAR TAGIHAN RUTIN
// ==========================================
const showPayBillSheet = ref(false)
const selectedBill = ref(null)
const payBillWalletId = ref(null)
const payBillAmount = ref(0)
const payBillError = ref('')

function openPayBill(payment) {
  selectedBill.value = payment
  payBillWalletId.value =
    payment.default_wallet_id || financeStore.wallets[0]?.id || null
  payBillAmount.value = Number(payment.amount || 0)
  payBillError.value = ''
  showPayBillSheet.value = true
}

async function handleConfirmPayBill() {
  if (!selectedBill.value) return
  if (!payBillWalletId.value) {
    payBillError.value = 'Pilih dompet pembayaran terlebih dahulu.'
    return
  }
  payBillError.value = ''
  try {
    await financeStore.payBill(selectedBill.value.id, {
      wallet_id: payBillWalletId.value,
      amount: Number(payBillAmount.value) || Number(selectedBill.value.amount),
    })
    showPayBillSheet.value = false
    selectedBill.value = null
  } catch (err) {
    payBillError.value =
      err.response?.data?.message || 'Gagal memproses pembayaran tagihan.'
  }
}

// ==========================================
// DETAIL, EDIT, & HAPUS TRANSAKSI
// ==========================================
const showTxDetailSheet = ref(false)
const selectedTx = ref(null)
const confirmDeleteTx = ref(false)
const txActionError = ref('')

function openTxDetail(tx) {
  selectedTx.value = tx
  confirmDeleteTx.value = false
  txActionError.value = ''
  showTxDetailSheet.value = true
}

function handleEditTx() {
  if (!selectedTx.value) return
  const txToEdit = selectedTx.value
  showTxDetailSheet.value = false
  showAllTxSheet.value = false
  financeStore.openTransactionSheet(txToEdit.type, txToEdit)
}

async function handleDeleteTx() {
  if (!selectedTx.value) return
  txActionError.value = ''
  try {
    await financeStore.removeTransaction(selectedTx.value.id)
    showTxDetailSheet.value = false
    selectedTx.value = null
  } catch (err) {
    txActionError.value =
      err.response?.data?.message || 'Gagal menghapus transaksi.'
  }
}

// ==========================================
// TRANSACTION LIST & FILTER
// ==========================================
const quickTxFilter = ref('') // '' | 'expense' | 'income' | 'transfer'
const showAllTxSheet = ref(false)
const filterType = ref('')
const filterWalletId = ref('')
const filterCategoryId = ref('')
const filterSearch = ref('')

const dashboardTransactions = computed(() => {
  const source = financeStore.transactions?.length
    ? financeStore.transactions
    : financeStore.recentTransactions
  const filtered = (source || []).filter((tx) => {
    if (quickTxFilter.value && tx.type !== quickTxFilter.value) return false
    return true
  })
  return filtered.slice(0, 8)
})

async function openAllTransactions() {
  showAllTxSheet.value = true
  await financeStore.fetchTransactions({ per_page: 200 })
}

const filteredAllTransactions = computed(() => {
  const list = financeStore.transactions?.length
    ? financeStore.transactions
    : financeStore.recentTransactions
  return (list || []).filter((tx) => {
    if (filterType.value && tx.type !== filterType.value) return false
    if (
      filterWalletId.value &&
      String(tx.wallet_id) !== String(filterWalletId.value) &&
      String(tx.destination_wallet_id) !== String(filterWalletId.value)
    ) {
      return false
    }
    if (
      filterCategoryId.value &&
      String(tx.finance_category_id) !== String(filterCategoryId.value)
    ) {
      return false
    }
    if (filterSearch.value.trim()) {
      const q = filterSearch.value.trim().toLowerCase()
      const titleMatch = (tx.title || '').toLowerCase().includes(q)
      const descMatch = (tx.description || '').toLowerCase().includes(q)
      const catMatch = (tx.category?.name || '').toLowerCase().includes(q)
      if (!titleMatch && !descMatch && !catMatch) return false
    }
    return true
  })
})
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <!-- ============================================================ -->
    <!-- BARIS 1: HERO SALDO & ARUS KAS + KONSISTENSI 7 HARI          -->
    <!-- ============================================================ -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
      <!-- Hero Saldo Utama (2 Kolom Desktop) -->
      <section
        class="lg:col-span-2 relative overflow-hidden rounded-3xl p-6 sm:p-7 text-white bg-gradient-to-br from-[#144229] via-[#1d5236] to-[#2d5a3f] dark:from-[#123823] dark:via-[#16422b] dark:to-[#1f4a33] shadow-[0px_10px_30px_rgba(20,66,41,0.18)] flex flex-col justify-between gap-5"
      >
        <!-- Ornamen Dekoratif -->
        <div class="pointer-events-none absolute -top-16 -right-12 w-56 h-56 rounded-full bg-[#a1d2af]/20 blur-3xl" />
        <div class="pointer-events-none absolute -bottom-20 left-10 w-48 h-48 rounded-full bg-[#d3e4d8]/10 blur-2xl" />

        <!-- Top: Label & Total Saldo + Privacy Toggle -->
        <div class="relative flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#a1d2af]">
              Total Saldo Seluruh Dompet
            </p>
            <h2 class="mt-1.5 text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight truncate">
              {{ financeStore.formatMoney(financeStore.totalBalance) }}
            </h2>
            <p class="mt-1 text-xs text-white/70">
              Tersebar di {{ financeStore.currentWallets.length }} akun dompet aktif pada siklus ini
            </p>
          </div>

          <button
            type="button"
            @click="financeStore.toggleBalanceVisibility()"
            class="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-white/12 hover:bg-white/20 active:scale-95 text-[#d3e4d8] transition-all cursor-pointer backdrop-blur-sm"
            :aria-label="financeStore.isBalanceHidden ? 'Tampilkan nominal' : 'Sembunyikan nominal'"
          >
            <component :is="financeStore.isBalanceHidden ? EyeClosed : Eye" class="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        <!-- Middle: 3 Pill Ringkasan Arus Kas Periode Ini -->
        <div class="relative grid grid-cols-3 gap-2.5 sm:gap-3 pt-1">
          <div class="rounded-2xl bg-white/10 border border-white/10 px-3.5 py-2.5 backdrop-blur-sm">
            <span class="text-[11px] text-[#d3e4d8]/80 block truncate">Pemasukan</span>
            <span class="mt-0.5 text-xs sm:text-sm font-extrabold text-emerald-300 tabular-nums block truncate">
              {{ financeStore.formatMoney(financeStore.periodIncome, { withSign: true, compact: true }) }}
            </span>
          </div>

          <div class="rounded-2xl bg-white/10 border border-white/10 px-3.5 py-2.5 backdrop-blur-sm">
            <span class="text-[11px] text-[#d3e4d8]/80 block truncate">Pengeluaran</span>
            <span class="mt-0.5 text-xs sm:text-sm font-extrabold text-rose-300 tabular-nums block truncate">
              {{ financeStore.formatMoney(-Math.abs(financeStore.periodExpense), { withSign: true, compact: true }) }}
            </span>
          </div>

          <div class="rounded-2xl bg-white/10 border border-white/10 px-3.5 py-2.5 backdrop-blur-sm">
            <span class="text-[11px] text-[#d3e4d8]/80 block truncate">Arus Kas Bersih</span>
            <span class="mt-0.5 text-xs sm:text-sm font-extrabold text-white tabular-nums block truncate">
              {{ financeStore.formatMoney(financeStore.netCashflow, { withSign: true, compact: true }) }}
            </span>
          </div>
        </div>

        <!-- Bottom: Tombol Aksi Cepat (Pengeluaran, Pemasukan, Transfer) -->
        <div class="relative flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            @click="financeStore.openTransactionSheet('expense')"
            class="h-10 px-4 rounded-full inline-flex items-center justify-center gap-1.5 bg-[#ba1a1a] hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <ArrowDownRight class="w-4 h-4 stroke-[2.3]" />
            <span>+ Pengeluaran</span>
          </button>

          <button
            type="button"
            @click="financeStore.openTransactionSheet('income')"
            class="h-10 px-4 rounded-full inline-flex items-center justify-center gap-1.5 bg-white text-[#144229] hover:bg-[#d3e4d8] active:scale-95 text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <ArrowUpRight class="w-4 h-4 stroke-[2.3]" />
            <span>+ Pemasukan</span>
          </button>

          <button
            type="button"
            @click="financeStore.openTransactionSheet('transfer')"
            class="h-10 px-4 rounded-full inline-flex items-center justify-center gap-1.5 bg-white/12 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all cursor-pointer backdrop-blur-sm"
          >
            <Shuffle class="w-3.5 h-3.5" />
            <span>Transfer Dompet</span>
          </button>
        </div>
      </section>

      <!-- Kartu Konsistensi 7 Hari (Simple Capsule Card seperti di Dashboard) -->
      <FinanceWeeklyConsistency />
    </div>

    <!-- ============================================================ -->
    <!-- BARIS 2: SHORTCUT MENU KE FITUR LAIN                         -->
    <!-- ============================================================ -->
    <FinanceFeatureCarousel />

    <!-- ============================================================ -->
    <!-- BARIS 3: CARD / WALLET LIST (DOMPET & KARTU)                 -->
    <!-- ============================================================ -->
    <section
      class="rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-surface space-y-4"
    >
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100">Dompet &amp; Kartu</h3>
          <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Daftar akun penyimpanan dana aktif
          </p>
        </div>
        <button
          type="button"
          @click="router.push('/finance/wallets')"
          class="inline-flex items-center gap-1 text-xs font-bold text-[#144229] dark:text-[#a1d2af] hover:underline cursor-pointer"
        >
          <span>Kelola Dompet</span>
          <NavArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Loading Skeleton Dompet -->
      <div
        v-if="financeStore.isLoading && financeStore.currentWallets.length === 0"
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
      >
        <div
          v-for="n in 3"
          :key="n"
          class="h-24 rounded-2xl border border-[#e2e2e5] dark:border-zinc-800 bg-[#f9f9fc] dark:bg-zinc-800/50 animate-pulse"
        />
      </div>

      <div
        v-else
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
      >
        <button
          v-for="wallet in financeStore.currentWallets"
          :key="wallet.id"
          type="button"
          @click="router.push('/finance/wallets')"
          class="p-4 rounded-2xl bg-[#f9f9fc] dark:bg-zinc-800/50 border border-[#e2e2e5] dark:border-zinc-800 hover:border-[#144229]/40 dark:hover:border-zinc-700 transition-all cursor-pointer flex flex-col justify-between text-left group"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <div
              class="w-9 h-9 rounded-xl bg-[#d3e4d8]/60 dark:bg-[#144229]/55 flex items-center justify-center shrink-0 text-[#144229] dark:text-[#a1d2af] group-hover:scale-105 transition-transform"
            >
              <component :is="getWalletIcon(wallet.type)" class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <span
                class="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 block truncate"
                :title="wallet.name"
              >
                {{ wallet.name }}
              </span>
              <span class="text-[10px] font-medium text-slate-400 dark:text-zinc-500 block truncate">
                {{ getWalletTypeLabel(wallet.type) }}
              </span>
            </div>
          </div>

          <p
            class="mt-3 text-sm sm:text-base font-extrabold tabular-nums text-slate-900 dark:text-zinc-100 truncate"
          >
            {{ financeStore.formatMoney(wallet.balance) }}
          </p>
        </button>

        <!-- Tombol Tambah Dompet -->
        <button
          type="button"
          @click="router.push('/finance/wallets')"
          class="p-4 rounded-2xl border border-dashed border-[#e2e2e5] dark:border-zinc-800 hover:border-[#144229]/50 hover:bg-[#f9f9fc] dark:hover:bg-zinc-800/40 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 min-h-[104px]"
        >
          <span class="w-8 h-8 rounded-full bg-[#f3f3f6] dark:bg-zinc-800 text-[#144229] dark:text-[#a1d2af] flex items-center justify-center">
            <Plus class="w-4 h-4" />
          </span>
          <span class="text-xs font-bold text-[#144229] dark:text-[#a1d2af]">
            Tambah Dompet
          </span>
        </button>
      </div>
    </section>

    <!-- ============================================================ -->
    <!-- BARIS 4: CHART PENGELUARAN BY CATEGORY + BUDGET & TAGIHAN    -->
    <!-- ============================================================ -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
      <!-- Kiri (5 Kolom): Chart Pengeluaran by Category -->
      <section
        class="lg:col-span-5 rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-surface flex flex-col justify-between space-y-4"
      >
        <div class="flex items-center justify-between gap-2">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Pengeluaran per Kategori
            </h3>
            <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Distribusi pengeluaran periode ini
            </p>
          </div>
          <button
            type="button"
            @click="router.push('/finance/statistics')"
            class="inline-flex items-center gap-1 text-xs font-bold text-[#144229] dark:text-[#a1d2af] hover:underline cursor-pointer"
          >
            <span>Detail</span>
            <NavArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <div
          v-if="categoryBreakdown.length === 0"
          class="flex-1 flex flex-col items-center justify-center min-h-[200px] rounded-2xl border border-dashed border-[#e2e2e5] dark:border-zinc-800 px-4 text-center"
        >
          <p class="text-xs text-slate-400 dark:text-zinc-500">
            Belum ada pengeluaran tercatat pada periode ini.
          </p>
        </div>

        <div v-else class="space-y-4">
          <!-- Donut Chart -->
          <div class="relative h-44 flex items-center justify-center">
            <Doughnut :data="doughnutChartData" :options="doughnutChartOptions" />
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Total Keluar
              </span>
              <span class="text-sm font-extrabold text-slate-900 dark:text-zinc-100 tabular-nums mt-0.5">
                {{ financeStore.formatMoney(financeStore.periodExpense, { compact: true }) }}
              </span>
            </div>
          </div>

          <!-- Top 5 Category List -->
          <div class="space-y-2.5 pt-2 border-t border-[#e2e2e5] dark:border-zinc-800">
            <div
              v-for="(item, idx) in categoryBreakdown.slice(0, 5)"
              :key="item.category_id ?? `cat-${idx}`"
              class="space-y-1 text-xs"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <div
                    class="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                    :style="{ backgroundColor: item.color || '#144229' }"
                  >
                    <component :is="getCategoryIcon(item.icon)" class="w-3.5 h-3.5 stroke-[2]" />
                  </div>
                  <span class="font-bold text-slate-800 dark:text-zinc-200 truncate">
                    {{ item.category_name }}
                  </span>
                </div>
                <div class="flex items-center gap-2 tabular-nums shrink-0">
                  <span class="font-bold text-slate-900 dark:text-zinc-100">
                    {{ financeStore.formatMoney(item.total, { compact: true }) }}
                  </span>
                  <span class="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 w-10 text-right">
                    {{ item.percentage }}%
                  </span>
                </div>
              </div>
              <div class="w-full h-1.5 rounded-full bg-[#f3f3f6] dark:bg-zinc-800 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :style="{
                    width: `${Math.min(100, item.percentage)}%`,
                    backgroundColor: item.color || '#144229',
                  }"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Kanan (7 Kolom): Budget List & Pengeluaran Rutin -->
      <div class="lg:col-span-7 flex flex-col gap-4 sm:gap-5">
        <!-- Kartu 1: Budget List (Anggaran Kategori) -->
        <section
          class="rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-surface space-y-4"
        >
          <div class="flex items-center justify-between gap-2">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Daftar Budget Kategori
              </h3>
              <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Pantau batas pemakaian anggaran bulanan
              </p>
            </div>
            <button
              type="button"
              @click="router.push('/finance/budgeting')"
              class="inline-flex items-center gap-1 text-xs font-bold text-[#144229] dark:text-[#a1d2af] hover:underline cursor-pointer"
            >
              <span>Atur Budget</span>
              <NavArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Overall Progress Bar jika ada budget -->
          <div
            v-if="financeStore.budgetSummary.total_limit > 0"
            class="p-3.5 rounded-2xl bg-[#f9f9fc] dark:bg-zinc-800/50 border border-[#e2e2e5] dark:border-zinc-800 space-y-2"
          >
            <div class="flex justify-between items-baseline text-xs">
              <span class="font-semibold text-slate-600 dark:text-zinc-300">Total Realisasi Budget</span>
              <span
                class="font-extrabold tabular-nums"
                :class="
                  financeStore.budgetSummary.total_spent > financeStore.budgetSummary.total_limit
                    ? 'text-[#ba1a1a] dark:text-rose-400'
                    : financeStore.budgetSummary.percentage >= 80
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-[#144229] dark:text-[#a1d2af]'
                "
              >
                {{ financeStore.budgetSummary.percentage }}% Terpakai
              </span>
            </div>

            <div class="w-full h-2 rounded-full bg-[#e2e2e5] dark:bg-zinc-700 overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="
                  financeStore.budgetSummary.total_spent > financeStore.budgetSummary.total_limit
                    ? 'bg-[#ba1a1a]'
                    : financeStore.budgetSummary.percentage >= 80
                      ? 'bg-amber-500'
                      : 'bg-[#144229] dark:bg-[#a1d2af]'
                "
                :style="{ width: `${Math.min(100, financeStore.budgetSummary.percentage)}%` }"
              />
            </div>

            <div class="flex justify-between text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
              <span>Terpakai: {{ financeStore.formatMoney(financeStore.budgetSummary.total_spent, { compact: true }) }}</span>
              <span>Batas: {{ financeStore.formatMoney(financeStore.budgetSummary.total_limit, { compact: true }) }}</span>
            </div>
          </div>

          <!-- Daftar Item Budget per Kategori -->
          <div v-if="financeStore.budgets.length > 0" class="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            <div
              v-for="b in financeStore.budgets"
              :key="b.id"
              class="p-3 rounded-2xl bg-[#f9f9fc] dark:bg-zinc-800/35 border border-[#e2e2e5]/80 dark:border-zinc-800 space-y-1.5 text-xs"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <div
                    class="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                    :style="{ backgroundColor: b.category?.color || '#144229' }"
                  >
                    <component :is="getCategoryIcon(b.category?.icon)" class="w-3.5 h-3.5" />
                  </div>
                  <span class="font-bold text-slate-900 dark:text-zinc-100 truncate">
                    {{ b.category?.name || 'Kategori' }}
                  </span>
                </div>
                <span
                  class="font-bold tabular-nums shrink-0"
                  :class="b.is_over_budget ? 'text-[#ba1a1a] dark:text-rose-400' : 'text-slate-700 dark:text-zinc-300'"
                >
                  {{ financeStore.formatMoney(b.spent, { compact: true }) }} / {{ financeStore.formatMoney(b.amount_limit, { compact: true }) }}
                </span>
              </div>
              <div class="w-full h-1.5 rounded-full bg-[#e2e2e5] dark:bg-zinc-700 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="
                    b.is_over_budget
                      ? 'bg-[#ba1a1a]'
                      : b.percentage >= 80
                        ? 'bg-amber-500'
                        : 'bg-[#144229] dark:bg-[#a1d2af]'
                  "
                  :style="{ width: `${Math.min(100, b.percentage)}%` }"
                />
              </div>
            </div>
          </div>

          <div
            v-else
            class="py-6 rounded-2xl border border-dashed border-[#e2e2e5] dark:border-zinc-800 text-center"
          >
            <p class="text-xs text-slate-400 dark:text-zinc-500">Belum ada anggaran kategori di periode ini.</p>
            <button
              type="button"
              @click="router.push('/finance/budgeting')"
              class="mt-1.5 text-xs font-bold text-[#144229] dark:text-[#a1d2af] hover:underline cursor-pointer"
            >
              + Buat Budget Pertama
            </button>
          </div>
        </section>

        <!-- Kartu 2: Pengeluaran Rutin / Tagihan Bulan Ini -->
        <section
          class="rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-surface space-y-3.5"
        >
          <div class="flex items-center justify-between gap-2">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Pengeluaran &amp; Tagihan Rutin
              </h3>
              <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Tagihan terjadwal yang menunggu pembayaran di periode ini
              </p>
            </div>
            <button
              type="button"
              @click="router.push('/finance/budgeting')"
              class="inline-flex items-center gap-1 text-xs font-bold text-[#144229] dark:text-[#a1d2af] hover:underline cursor-pointer"
            >
              <span>Kelola</span>
              <NavArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            v-if="financeStore.upcomingPayments.length === 0"
            class="py-5 rounded-2xl border border-dashed border-[#e2e2e5] dark:border-zinc-800 text-center text-xs text-slate-400 dark:text-zinc-500"
          >
            Semua pengeluaran rutin di periode ini sudah beres.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="payment in financeStore.upcomingPayments"
              :key="payment.id"
              class="p-3 rounded-2xl bg-[#f9f9fc] dark:bg-zinc-800/40 border border-[#e2e2e5] dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
            >
              <div class="min-w-0">
                <span class="font-bold text-slate-900 dark:text-zinc-100 block truncate">
                  {{ payment.name }}
                </span>
                <span class="text-[11px] text-slate-400 dark:text-zinc-500 tabular-nums">
                  Jatuh Tempo: Tgl {{ payment.due_day }} · {{ financeStore.formatMoney(payment.amount) }}
                </span>
              </div>
              <button
                type="button"
                @click="openPayBill(payment)"
                class="px-4 py-1.5 rounded-full bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shrink-0"
              >
                Bayar
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- BARIS 5: TRANSACTION LIST (RIWAYAT TRANSAKSI PERIODE INI)    -->
    <!-- ============================================================ -->
    <section
      class="rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-surface space-y-4"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100">
            Daftar Transaksi
          </h3>
          <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Catatan arus kas terbaru pada siklus aktif
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <button
            v-for="tab in [
              { id: '', label: 'Semua' },
              { id: 'expense', label: 'Pengeluaran' },
              { id: 'income', label: 'Pemasukan' },
              { id: 'transfer', label: 'Transfer' },
            ]"
            :key="tab.id"
            type="button"
            @click="quickTxFilter = tab.id"
            class="px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer"
            :class="
              quickTxFilter === tab.id
                ? 'bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110]'
                : 'bg-[#f3f3f6] dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
            "
          >
            {{ tab.label }}
          </button>

          <button
            type="button"
            @click="openAllTransactions"
            class="ml-1 inline-flex items-center gap-1 text-xs font-bold text-[#144229] dark:text-[#a1d2af] hover:underline cursor-pointer"
          >
            <span>Lihat Semua</span>
            <NavArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        v-if="dashboardTransactions.length === 0"
        class="py-8 rounded-2xl border border-dashed border-[#e2e2e5] dark:border-zinc-800 text-center text-xs text-slate-400 dark:text-zinc-500"
      >
        Belum ada catatan transaksi untuk filter ini.
      </div>

      <div v-else class="divide-y divide-[#e2e2e5] dark:divide-zinc-800/80">
        <button
          v-for="tx in dashboardTransactions"
          :key="tx.id"
          type="button"
          @click="openTxDetail(tx)"
          class="w-full py-3 flex items-center justify-between text-xs first:pt-0 last:pb-0 hover:bg-slate-50/70 dark:hover:bg-zinc-800/30 rounded-xl px-2 -mx-2 transition-colors cursor-pointer text-left"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-2xs"
              :style="{
                backgroundColor:
                  tx.type === 'transfer'
                    ? '#373b3a'
                    : tx.category?.color || (tx.type === 'income' ? '#144229' : '#ba1a1a'),
              }"
            >
              <Shuffle v-if="tx.type === 'transfer'" class="w-4 h-4 stroke-[2]" />
              <component
                v-else
                :is="getCategoryIcon(tx.category?.icon)"
                class="w-4 h-4 stroke-[2]"
              />
            </div>

            <div class="min-w-0">
              <span class="font-bold text-slate-900 dark:text-zinc-100 block truncate">
                {{ tx.title || 'Transaksi' }}
              </span>
              <span class="text-[11px] text-slate-400 dark:text-zinc-500 truncate block">
                {{ formatDate(tx.transaction_date) }} · {{ tx.wallet?.name || 'Dompet' }}
                <span v-if="tx.category?.name">· {{ tx.category.name }}</span>
              </span>
            </div>
          </div>

          <div
            class="font-extrabold tabular-nums text-right shrink-0 pl-2"
            :class="
              tx.type === 'income'
                ? 'text-[#144229] dark:text-[#a1d2af]'
                : tx.type === 'transfer'
                  ? 'text-slate-700 dark:text-zinc-300'
                  : 'text-[#ba1a1a] dark:text-rose-400'
            "
          >
            {{
              financeStore.formatMoney(
                tx.type === 'expense' ? -Math.abs(tx.amount) : tx.amount,
                { withSign: tx.type !== 'transfer' }
              )
            }}
          </div>
        </button>
      </div>
    </section>

    <!-- ============================================================ -->
    <!-- BOTTOM SHEET 1: KONFIRMASI BAYAR TAGIHAN RUTIN               -->
    <!-- ============================================================ -->
    <BottomSheet
      :show="showPayBillSheet"
      title="Bayar Tagihan Rutin"
      @close="showPayBillSheet = false"
    >
      <form v-if="selectedBill" @submit.prevent="handleConfirmPayBill" class="space-y-4">
        <div class="p-3.5 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800/70 flex items-center justify-between">
          <div>
            <p class="text-xs font-bold text-slate-900 dark:text-zinc-100">{{ selectedBill.name }}</p>
            <p class="text-[11px] text-slate-500 dark:text-zinc-400">
              Jatuh tempo setiap tanggal {{ selectedBill.due_day }}
            </p>
          </div>
          <BaseBadge variant="emerald" size="xs">Tagihan Rutin</BaseBadge>
        </div>

        <div
          v-if="payBillError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ payBillError }}
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
            Pilih Dompet Sumber Dana
          </label>
          <select
            v-model="payBillWalletId"
            class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-xs font-bold text-slate-800 dark:text-zinc-200 outline-none"
          >
            <option v-for="w in financeStore.wallets" :key="w.id" :value="w.id">
              {{ w.name }} ({{ financeStore.formatMoney(w.balance) }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
            Nominal Pembayaran (IDR)
          </label>
          <input
            type="number"
            v-model="payBillAmount"
            min="1"
            required
            class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-sm font-extrabold tabular-nums text-slate-900 dark:text-zinc-100 outline-none"
          />
        </div>

        <div class="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            @click="showPayBillSheet = false"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="financeStore.isSaving"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {{ financeStore.isSaving ? 'Memproses...' : 'Konfirmasi & Bayar' }}
          </button>
        </div>
      </form>
    </BottomSheet>

    <!-- ============================================================ -->
    <!-- BOTTOM SHEET 2: RINCIAN TRANSAKSI (EDIT / HAPUS)             -->
    <!-- ============================================================ -->
    <BottomSheet
      :show="showTxDetailSheet"
      title="Rincian Transaksi"
      @close="showTxDetailSheet = false"
    >
      <div v-if="selectedTx" class="space-y-4">
        <div class="flex items-center justify-between p-4 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800/70">
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-2xs"
              :style="{
                backgroundColor:
                  selectedTx.type === 'transfer'
                    ? '#373b3a'
                    : selectedTx.category?.color || (selectedTx.type === 'income' ? '#144229' : '#ba1a1a'),
              }"
            >
              <Shuffle v-if="selectedTx.type === 'transfer'" class="w-5 h-5 stroke-[2]" />
              <component
                v-else
                :is="getCategoryIcon(selectedTx.category?.icon)"
                class="w-5 h-5 stroke-[2]"
              />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                {{ selectedTx.title || 'Transaksi' }}
              </p>
              <p class="text-xs text-slate-500 dark:text-zinc-400">
                {{ selectedTx.category?.name || (selectedTx.type === 'transfer' ? 'Transfer Antar Dompet' : 'Uncategorized') }}
              </p>
            </div>
          </div>

          <div
            class="text-base font-extrabold tabular-nums text-right shrink-0 pl-2"
            :class="
              selectedTx.type === 'income'
                ? 'text-[#144229] dark:text-[#a1d2af]'
                : selectedTx.type === 'transfer'
                  ? 'text-slate-800 dark:text-zinc-200'
                  : 'text-[#ba1a1a] dark:text-rose-400'
            "
          >
            {{
              financeStore.formatMoney(
                selectedTx.type === 'expense' ? -Math.abs(selectedTx.amount) : selectedTx.amount,
                { withSign: selectedTx.type !== 'transfer', ignoreMask: true }
              )
            }}
          </div>
        </div>

        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1.5 border-b border-[#e2e2e5] dark:border-zinc-800">
            <span class="text-slate-500 dark:text-zinc-400">Waktu Transaksi</span>
            <span class="font-bold text-slate-900 dark:text-zinc-100 tabular-nums">
              {{ formatDate(selectedTx.transaction_date) }}
            </span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-[#e2e2e5] dark:border-zinc-800">
            <span class="text-slate-500 dark:text-zinc-400">Dompet</span>
            <span class="font-bold text-slate-900 dark:text-zinc-100">
              {{ selectedTx.wallet?.name || '-' }}
              <template v-if="selectedTx.type === 'transfer' && selectedTx.destination_wallet">
                → {{ selectedTx.destination_wallet.name }}
              </template>
            </span>
          </div>
          <div
            v-if="selectedTx.description"
            class="flex justify-between py-1.5 border-b border-[#e2e2e5] dark:border-zinc-800 gap-4"
          >
            <span class="text-slate-500 dark:text-zinc-400 shrink-0">Catatan</span>
            <span class="font-semibold text-slate-800 dark:text-zinc-200 text-right">
              {{ selectedTx.description }}
            </span>
          </div>
        </div>

        <div
          v-if="txActionError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ txActionError }}
        </div>

        <div
          v-if="confirmDeleteTx"
          class="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2.5"
        >
          <p class="text-xs font-semibold text-[#ba1a1a] dark:text-rose-300">
            Hapus transaksi ini? Saldo dompet terkait akan otomatis dikembalikan.
          </p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="confirmDeleteTx = false"
              class="flex-1 py-2 rounded-full text-xs font-bold bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-[#e2e2e5] dark:border-zinc-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              :disabled="financeStore.isSaving"
              @click="handleDeleteTx"
              class="flex-1 py-2 rounded-full text-xs font-bold bg-[#ba1a1a] text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {{ financeStore.isSaving ? 'Menghapus...' : 'Ya, Hapus' }}
            </button>
          </div>
        </div>

        <div v-else class="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            @click="confirmDeleteTx = true"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-[#ba1a1a] dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash class="w-3.5 h-3.5" />
            <span>Hapus</span>
          </button>
          <button
            type="button"
            @click="handleEditTx"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <EditPencil class="w-3.5 h-3.5" />
            <span>Edit Transaksi</span>
          </button>
        </div>
      </div>
    </BottomSheet>

    <!-- ============================================================ -->
    <!-- BOTTOM SHEET 3: SEMUA TRANSAKSI & FILTER LENGKAP             -->
    <!-- ============================================================ -->
    <BottomSheet
      :show="showAllTxSheet"
      :title="`Semua Transaksi (${financeStore.activePeriod?.name || 'Periode Ini'})`"
      @close="showAllTxSheet = false"
    >
      <div class="space-y-3">
        <div class="relative">
          <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            v-model="filterSearch"
            placeholder="Cari judul, catatan, atau kategori..."
            class="w-full pl-8 pr-3 py-2 rounded-xl bg-[#f3f3f6] dark:bg-zinc-800 text-xs text-slate-900 dark:text-zinc-100 outline-none"
          />
        </div>

        <div class="grid grid-cols-3 gap-2">
          <select
            v-model="filterType"
            class="p-2 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-[11px] font-bold text-slate-700 dark:text-zinc-300 outline-none"
          >
            <option value="">Semua Tipe</option>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
            <option value="transfer">Transfer</option>
          </select>

          <select
            v-model="filterWalletId"
            class="p-2 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-[11px] font-bold text-slate-700 dark:text-zinc-300 outline-none"
          >
            <option value="">Semua Dompet</option>
            <option v-for="w in financeStore.wallets" :key="w.id" :value="w.id">
              {{ w.name }}
            </option>
          </select>

          <select
            v-model="filterCategoryId"
            class="p-2 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-[11px] font-bold text-slate-700 dark:text-zinc-300 outline-none"
          >
            <option value="">Semua Kategori</option>
            <option v-for="c in financeStore.categories" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>

        <div class="max-h-[55vh] overflow-y-auto divide-y divide-[#e2e2e5] dark:divide-zinc-800 pr-1">
          <div
            v-if="filteredAllTransactions.length === 0"
            class="py-8 text-center text-xs text-slate-400 dark:text-zinc-500"
          >
            Tidak ada transaksi yang cocok dengan filter.
          </div>

          <button
            v-for="tx in filteredAllTransactions"
            :key="tx.id"
            type="button"
            @click="openTxDetail(tx)"
            class="w-full py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-xl px-1.5 transition-colors cursor-pointer text-left"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <div
                class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white"
                :style="{
                  backgroundColor:
                    tx.type === 'transfer'
                      ? '#373b3a'
                      : tx.category?.color || (tx.type === 'income' ? '#144229' : '#ba1a1a'),
                }"
              >
                <Shuffle v-if="tx.type === 'transfer'" class="w-3.5 h-3.5" />
                <component v-else :is="getCategoryIcon(tx.category?.icon)" class="w-3.5 h-3.5" />
              </div>
              <div class="min-w-0">
                <span class="font-bold text-slate-900 dark:text-zinc-100 block truncate">
                  {{ tx.title || 'Transaksi' }}
                </span>
                <span class="text-[10px] text-slate-400 dark:text-zinc-500 block truncate">
                  {{ formatDate(tx.transaction_date) }} · {{ tx.wallet?.name || 'Dompet' }}
                  <span v-if="tx.category?.name">· {{ tx.category.name }}</span>
                </span>
              </div>
            </div>

            <span
              class="font-extrabold tabular-nums shrink-0 pl-2"
              :class="
                tx.type === 'income'
                  ? 'text-[#144229] dark:text-[#a1d2af]'
                  : tx.type === 'transfer'
                    ? 'text-slate-700 dark:text-zinc-300'
                    : 'text-[#ba1a1a] dark:text-rose-400'
              "
            >
              {{
                financeStore.formatMoney(
                  tx.type === 'expense' ? -Math.abs(tx.amount) : tx.amount,
                  { withSign: tx.type !== 'transfer' }
                )
              }}
            </span>
          </button>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>
