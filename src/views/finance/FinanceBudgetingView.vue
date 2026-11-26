<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Trash, EditPencil, NavArrowLeft, Percentage, Calendar } from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import { getCategoryIcon } from '@/utils/categoryIcons'
import { useFinanceStore } from '@/stores/financeStore'

const router = useRouter()
const financeStore = useFinanceStore()

const isBudgetSheetOpen = ref(false)
const isPaymentSheetOpen = ref(false)
const isPayBillSheetOpen = ref(false)
const isDeleteSheetOpen = ref(false)
const deleteTarget = ref(null) // { type: 'budget' | 'payment', item }
const formError = ref('')

// Budget Form
const selectedCategoryId = ref(null)
const budgetAmountLimit = ref(0)

// Planned Payment Form
const editingPaymentId = ref(null)
const paymentName = ref('')
const paymentAmount = ref(0)
const paymentDueDay = ref(1)
const paymentCategoryId = ref(null)
const paymentDefaultWalletId = ref(null)

// Pay Bill Form
const selectedBill = ref(null)
const payBillWalletId = ref(null)
const payBillAmount = ref(0)

const expenseCategories = computed(() =>
  financeStore.categories.filter((c) => c.type === 'expense')
)

onMounted(async () => {
  await Promise.all([
    financeStore.fetchBudgets(),
    financeStore.fetchPlannedPayments(),
    financeStore.fetchCategories(),
    financeStore.fetchWallets(),
  ])
  initDefaultFormValues()
})

function initDefaultFormValues() {
  const firstExpenseCat = expenseCategories.value[0]
  if (firstExpenseCat) {
    selectedCategoryId.value = firstExpenseCat.id
    paymentCategoryId.value = firstExpenseCat.id
  }
  if (financeStore.wallets.length > 0) {
    paymentDefaultWalletId.value = financeStore.wallets[0].id
  }
}

function openSetBudget(existingBudget = null) {
  formError.value = ''
  if (existingBudget) {
    selectedCategoryId.value = existingBudget.finance_category_id
    budgetAmountLimit.value = Number(existingBudget.amount_limit || 0)
  } else {
    selectedCategoryId.value = expenseCategories.value[0]?.id || null
    budgetAmountLimit.value = 0
  }
  isBudgetSheetOpen.value = true
}

async function handleSaveBudget() {
  formError.value = ''
  if (!selectedCategoryId.value) {
    formError.value = 'Pilih kategori pengeluaran terlebih dahulu.'
    return
  }
  if (Number(budgetAmountLimit.value) <= 0) {
    formError.value = 'Batas maksimal anggaran harus lebih dari Rp 0.'
    return
  }
  try {
    await financeStore.saveBudget({
      finance_category_id: selectedCategoryId.value,
      amount_limit: parseFloat(budgetAmountLimit.value),
    })
    isBudgetSheetOpen.value = false
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan anggaran.'
  }
}

function openAddPayment() {
  formError.value = ''
  editingPaymentId.value = null
  paymentName.value = ''
  paymentAmount.value = 0
  paymentDueDay.value = 1
  paymentCategoryId.value = expenseCategories.value[0]?.id || null
  paymentDefaultWalletId.value = financeStore.wallets[0]?.id || null
  isPaymentSheetOpen.value = true
}

function openEditPayment(payment) {
  formError.value = ''
  editingPaymentId.value = payment.id
  paymentName.value = payment.name || ''
  paymentAmount.value = Number(payment.amount || 0)
  paymentDueDay.value = Number(payment.due_day || 1)
  paymentCategoryId.value = payment.finance_category_id || expenseCategories.value[0]?.id || null
  paymentDefaultWalletId.value = payment.default_wallet_id || financeStore.wallets[0]?.id || null
  isPaymentSheetOpen.value = true
}

async function handleSavePayment() {
  formError.value = ''
  if (!paymentName.value.trim() || Number(paymentAmount.value) <= 0) {
    formError.value = 'Nama tagihan dan jumlah nominal wajib diisi.'
    return
  }
  const due = Math.max(1, Math.min(31, parseInt(paymentDueDay.value, 10) || 1))
  const payload = {
    name: paymentName.value.trim(),
    amount: parseFloat(paymentAmount.value),
    due_day: due,
    finance_category_id: paymentCategoryId.value,
    default_wallet_id: paymentDefaultWalletId.value,
  }
  try {
    if (editingPaymentId.value) {
      await financeStore.editPlannedPayment(editingPaymentId.value, payload)
    } else {
      await financeStore.savePlannedPayment(payload)
    }
    isPaymentSheetOpen.value = false
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan tagihan rutin.'
  }
}

function openPayBill(payment) {
  formError.value = ''
  selectedBill.value = payment
  payBillWalletId.value = payment.default_wallet_id || financeStore.wallets[0]?.id || null
  payBillAmount.value = Number(payment.amount || 0)
  isPayBillSheetOpen.value = true
}

async function handleConfirmPayBill() {
  if (!selectedBill.value) return
  formError.value = ''
  try {
    await financeStore.payBill(selectedBill.value.id, {
      wallet_id: payBillWalletId.value,
      amount: parseFloat(payBillAmount.value) || selectedBill.value.amount,
    })
    isPayBillSheetOpen.value = false
    selectedBill.value = null
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal memproses pembayaran tagihan.'
  }
}

function openDeleteConfirm(type, item) {
  formError.value = ''
  deleteTarget.value = { type, item }
  isDeleteSheetOpen.value = true
}

async function handleConfirmDelete() {
  if (!deleteTarget.value) return
  formError.value = ''
  try {
    if (deleteTarget.value.type === 'budget') {
      await financeStore.removeBudget(deleteTarget.value.item.id)
    } else {
      await financeStore.removePlannedPayment(deleteTarget.value.item.id)
    }
    isDeleteSheetOpen.value = false
    deleteTarget.value = null
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menghapus item.'
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Navigasi Kembali ke Ringkasan -->
    <div>
      <button
        type="button"
        @click="router.push('/finance')"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-[#144229] dark:text-[#a1d2af] hover:underline cursor-pointer mb-2"
      >
        <NavArrowLeft class="w-4 h-4 stroke-[2.2]" />
        <span>Kembali ke Ringkasan</span>
      </button>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <BaseHeading as="h2" size="xl" weight="semibold">Anggaran & Tagihan Rutin</BaseHeading>
          <BaseText size="sm" variant="muted" class="mt-0.5">
            Atur batas pengeluaran per kategori dan kelola jadwal tagihan rutin bulanan.
          </BaseText>
        </div>
      </div>
    </div>

    <!-- Grid 2 Kolom Desktop: Anggaran Kategori & Tagihan Rutin -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      <!-- SEKSI 1: ANGGARAN KATEGORI -->
      <div class="space-y-3">
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Anggaran Kategori ({{ financeStore.budgets.length }})
          </h3>
          <button
            type="button"
            @click="openSetBudget()"
            class="h-8 px-3.5 rounded-full flex items-center gap-1.5 bg-[#144229] hover:bg-[#1f5637] text-white dark:bg-[#a1d2af] dark:text-[#002110] text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Set Anggaran</span>
          </button>
        </div>

        <BaseCard
          v-if="financeStore.budgets.length === 0"
          padding="p-8"
          class="text-center"
        >
          <Percentage class="w-9 h-9 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
          <BaseHeading as="h4" size="sm" weight="semibold">Belum ada anggaran kategori</BaseHeading>
          <BaseText size="xs" variant="muted" class="mt-1">
            Tentukan batas pengeluaran per kategori agar arus kas bulanan lebih terkendali.
          </BaseText>
          <div class="mt-3.5">
            <button
              type="button"
              @click="openSetBudget()"
              class="h-8 px-4 rounded-full bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] text-xs font-bold cursor-pointer"
            >
              + Buat Anggaran Pertama
            </button>
          </div>
        </BaseCard>

        <div v-else class="space-y-2.5">
          <BaseCard
            v-for="bgt in financeStore.budgets"
            :key="bgt.id"
            padding="p-4"
            class="space-y-2.5"
          >
            <div class="flex items-center justify-between gap-2 text-xs">
              <div class="flex items-center gap-2.5 min-w-0">
                <div
                  class="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                  :style="{ backgroundColor: bgt.category?.color || '#144229' }"
                >
                  <component :is="getCategoryIcon(bgt.category?.icon)" class="w-4 h-4 stroke-[2]" />
                </div>
                <span class="font-bold text-slate-900 dark:text-zinc-100 truncate">
                  {{ bgt.category?.name || 'Kategori' }}
                </span>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <span
                  class="font-bold tabular-nums mr-1"
                  :class="
                    bgt.is_over_budget
                      ? 'text-[#ba1a1a] dark:text-rose-400'
                      : bgt.percentage >= 80
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-700 dark:text-zinc-300'
                  "
                >
                  {{ bgt.percentage }}%
                </span>
                <button
                  type="button"
                  @click="openSetBudget(bgt)"
                  aria-label="Edit Anggaran"
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <EditPencil class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  @click="openDeleteConfirm('budget', bgt)"
                  aria-label="Hapus Anggaran"
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#ba1a1a] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <Trash class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="w-full h-2 rounded-full bg-[#f3f3f6] dark:bg-zinc-800 overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="
                  bgt.is_over_budget
                    ? 'bg-[#ba1a1a]'
                    : bgt.percentage >= 80
                      ? 'bg-amber-500'
                      : 'bg-[#144229] dark:bg-[#a1d2af]'
                "
                :style="{ width: `${Math.min(100, bgt.percentage)}%` }"
              ></div>
            </div>

            <div class="flex flex-wrap items-baseline justify-between gap-2 text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
              <span>Terpakai: {{ financeStore.formatMoney(bgt.spent, { compact: true }) }}</span>
              <span>
                Batas: {{ financeStore.formatMoney(bgt.amount_limit, { compact: true }) }}
                · Sisa: <strong class="text-slate-800 dark:text-zinc-200">{{ financeStore.formatMoney(bgt.remaining, { compact: true }) }}</strong>
              </span>
            </div>
          </BaseCard>
        </div>
      </div>

      <!-- SEKSI 2: TAGIHAN RUTIN (PLANNED PAYMENTS) -->
      <div class="space-y-3">
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Tagihan Rutin Bulanan ({{ financeStore.plannedPayments.length }})
          </h3>
          <button
            type="button"
            @click="openAddPayment"
            class="h-8 px-3.5 rounded-full flex items-center gap-1.5 bg-[#144229] hover:bg-[#1f5637] text-white dark:bg-[#a1d2af] dark:text-[#002110] text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Tambah Tagihan</span>
          </button>
        </div>

        <BaseCard
          v-if="financeStore.plannedPayments.length === 0"
          padding="p-8"
          class="text-center"
        >
          <Calendar class="w-9 h-9 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
          <BaseHeading as="h4" size="sm" weight="semibold">Belum ada tagihan rutin</BaseHeading>
          <BaseText size="xs" variant="muted" class="mt-1">
            Catat tagihan Wi-Fi, listrik, sewa, atau langganan bulanan agar dapat dilunasi dalam 1-klik.
          </BaseText>
          <div class="mt-3.5">
            <button
              type="button"
              @click="openAddPayment"
              class="h-8 px-4 rounded-full bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] text-xs font-bold cursor-pointer"
            >
              + Tambah Tagihan Pertama
            </button>
          </div>
        </BaseCard>

        <div v-else class="space-y-2.5">
          <BaseCard
            v-for="p in financeStore.plannedPayments"
            :key="p.id"
            padding="p-4"
            class="flex items-center justify-between gap-3 text-xs"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <div
                class="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                :style="{ backgroundColor: p.category?.color || '#144229' }"
              >
                <component :is="getCategoryIcon(p.category?.icon || 'bill')" class="w-4 h-4 stroke-[2]" />
              </div>
              <div class="min-w-0">
                <span class="font-bold text-sm text-slate-900 dark:text-zinc-100 block truncate">
                  {{ p.name }}
                </span>
                <div class="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500 tabular-nums">
                  <span>Tgl {{ p.due_day }}</span>
                  <span>·</span>
                  <span class="font-bold text-slate-700 dark:text-zinc-300">
                    {{ financeStore.formatMoney(p.amount) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button
                v-if="!p.is_paid"
                type="button"
                @click="openPayBill(p)"
                class="px-3 py-1.5 rounded-full bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] font-bold text-xs hover:opacity-90 shadow-2xs cursor-pointer"
              >
                Bayar
              </button>
              <BaseBadge v-else variant="emerald" size="xs">✓ Lunas</BaseBadge>

              <button
                type="button"
                @click="openEditPayment(p)"
                aria-label="Edit Tagihan"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <EditPencil class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="openDeleteConfirm('payment', p)"
                aria-label="Hapus Tagihan"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#ba1a1a] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <Trash class="w-3.5 h-3.5" />
              </button>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>

    <!-- BottomSheet: Set / Edit Anggaran -->
    <BottomSheet
      :show="isBudgetSheetOpen"
      title="Atur Anggaran Kategori"
      @close="isBudgetSheetOpen = false"
    >
      <form @submit.prevent="handleSaveBudget" class="space-y-3.5 text-xs">
        <div
          v-if="formError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ formError }}
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Pilih Kategori Pengeluaran
          </label>
          <select
            v-model="selectedCategoryId"
            required
            class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-semibold text-slate-900 dark:text-zinc-100 outline-none"
          >
            <option v-for="c in expenseCategories" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Batas Maksimal Anggaran (IDR)
          </label>
          <input
            type="number"
            v-model="budgetAmountLimit"
            min="1"
            required
            placeholder="Contoh: 1500000"
            class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-extrabold text-sm tabular-nums text-slate-900 dark:text-zinc-100 outline-none"
          />
        </div>

        <div class="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            @click="isBudgetSheetOpen = false"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="financeStore.isSaving"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {{ financeStore.isSaving ? 'Menyimpan...' : 'Simpan Anggaran' }}
          </button>
        </div>
      </form>
    </BottomSheet>

    <!-- BottomSheet: Tambah / Edit Tagihan Rutin -->
    <BottomSheet
      :show="isPaymentSheetOpen"
      :title="editingPaymentId ? 'Edit Tagihan Rutin' : 'Tambah Tagihan Rutin'"
      @close="isPaymentSheetOpen = false"
    >
      <form @submit.prevent="handleSavePayment" class="space-y-3.5 text-xs">
        <div
          v-if="formError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ formError }}
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Nama Tagihan
          </label>
          <input
            type="text"
            v-model="paymentName"
            required
            placeholder="Contoh: Indihome, Listrik, Netflix..."
            class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-semibold text-slate-900 dark:text-zinc-100 outline-none"
          />
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Nominal per Bulan (IDR)
          </label>
          <input
            type="number"
            v-model="paymentAmount"
            min="1"
            required
            placeholder="0"
            class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-extrabold text-sm tabular-nums text-slate-900 dark:text-zinc-100 outline-none"
          />
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Kategori Pengeluaran
          </label>
          <select
            v-model="paymentCategoryId"
            class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-semibold text-slate-900 dark:text-zinc-100 outline-none"
          >
            <option v-for="c in expenseCategories" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Tgl Jatuh Tempo (1-31)
            </label>
            <input
              type="number"
              min="1"
              max="31"
              required
              v-model="paymentDueDay"
              class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-bold tabular-nums text-slate-900 dark:text-zinc-100 outline-none"
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Dompet Default
            </label>
            <select
              v-model="paymentDefaultWalletId"
              class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-semibold text-slate-900 dark:text-zinc-100 outline-none"
            >
              <option v-for="w in financeStore.wallets" :key="w.id" :value="w.id">
                {{ w.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            @click="isPaymentSheetOpen = false"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="financeStore.isSaving"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {{ financeStore.isSaving ? 'Menyimpan...' : 'Simpan Tagihan' }}
          </button>
        </div>
      </form>
    </BottomSheet>

    <!-- BottomSheet: Konfirmasi Bayar Tagihan Rutin -->
    <BottomSheet
      :show="isPayBillSheetOpen"
      title="Bayar Tagihan Rutin"
      @close="isPayBillSheetOpen = false"
    >
      <form v-if="selectedBill" @submit.prevent="handleConfirmPayBill" class="space-y-4 text-xs">
        <div class="p-3.5 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800/70 flex items-center justify-between">
          <div>
            <p class="font-bold text-slate-900 dark:text-zinc-100">{{ selectedBill.name }}</p>
            <p class="text-[11px] text-slate-500 dark:text-zinc-400">
              Jatuh tempo setiap tanggal {{ selectedBill.due_day }}
            </p>
          </div>
          <BaseBadge variant="emerald" size="xs">Tagihan</BaseBadge>
        </div>

        <div
          v-if="formError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ formError }}
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Pilih Dompet Sumber Dana
          </label>
          <select
            v-model="payBillWalletId"
            class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-bold text-slate-800 dark:text-zinc-200 outline-none"
          >
            <option v-for="w in financeStore.wallets" :key="w.id" :value="w.id">
              {{ w.name }} ({{ financeStore.formatMoney(w.balance) }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
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

        <div class="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            @click="isPayBillSheetOpen = false"
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

    <!-- BottomSheet: Konfirmasi Hapus -->
    <BottomSheet
      :show="isDeleteSheetOpen"
      :title="deleteTarget?.type === 'budget' ? 'Hapus Anggaran?' : 'Hapus Tagihan Rutin?'"
      @close="isDeleteSheetOpen = false"
    >
      <div class="space-y-4 text-xs">
        <p class="text-slate-600 dark:text-zinc-400 leading-relaxed">
          Apakah kamu yakin ingin menghapus
          <strong class="text-slate-900 dark:text-zinc-100">
            {{ deleteTarget?.type === 'budget' ? deleteTarget?.item?.category?.name : deleteTarget?.item?.name }}
          </strong>?
        </p>

        <div
          v-if="formError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ formError }}
        </div>

        <div class="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            @click="isDeleteSheetOpen = false"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="financeStore.isSaving"
            @click="handleConfirmDelete"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#ba1a1a] text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {{ financeStore.isSaving ? 'Menghapus...' : 'Ya, Hapus' }}
          </button>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>
