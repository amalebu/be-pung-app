<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  HandCash,
  Plus,
  EditPencil,
  Trash,
  NavArrowLeft,
  Calendar,
} from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import { useFinanceStore } from '@/stores/financeStore'

const router = useRouter()
const financeStore = useFinanceStore()

const activeTab = ref('payable') // 'payable' (Hutang Saya) | 'receivable' (Piutang)
const isFormSheetOpen = ref(false)
const isPaySheetOpen = ref(false)
const isDeleteSheetOpen = ref(false)
const selectedDebt = ref(null)
const formError = ref('')

// Debt Form
const editingDebtId = ref(null)
const debtType = ref('payable')
const personName = ref('')
const debtTitle = ref('')
const debtAmount = ref(0)
const debtPaidAmount = ref(0)
const debtDueDate = ref('')
const debtNotes = ref('')
const debtRecordToWallet = ref(false)
const debtWalletId = ref(null)

// Pay / Cicil Form
const payAmount = ref(0)
const payRecordToWallet = ref(true)
const payWalletId = ref(null)
const payNotes = ref('')

onMounted(async () => {
  await Promise.all([
    financeStore.fetchDebts(),
    financeStore.fetchWallets(),
  ])
  if (financeStore.wallets.length > 0) {
    debtWalletId.value = financeStore.wallets[0].id
    payWalletId.value = financeStore.wallets[0].id
  }
})

const filteredDebts = computed(() =>
  financeStore.debts.filter((d) => d.type === activeTab.value)
)

const totalPayable = computed(() =>
  financeStore.debts
    .filter((d) => d.type === 'payable' && d.status !== 'paid')
    .reduce((acc, d) => acc + Math.max(0, Number(d.amount || 0) - Number(d.paid_amount || 0)), 0)
)

const totalReceivable = computed(() =>
  financeStore.debts
    .filter((d) => d.type === 'receivable' && d.status !== 'paid')
    .reduce((acc, d) => acc + Math.max(0, Number(d.amount || 0) - Number(d.paid_amount || 0)), 0)
)

const netDebtPosition = computed(() => totalReceivable.value - totalPayable.value)

function formatDate(dateStr) {
  if (!dateStr) return 'Tanpa jatuh tempo'
  const d = new Date(`${dateStr}T00:00:00`)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getRemaining(debt) {
  return Math.max(0, Number(debt.amount || 0) - Number(debt.paid_amount || 0))
}

function getProgress(debt) {
  const total = Number(debt.amount || 0)
  if (!total) return 0
  return Math.min(100, Math.round((Number(debt.paid_amount || 0) / total) * 100))
}

function openCreateDebt() {
  formError.value = ''
  editingDebtId.value = null
  debtType.value = activeTab.value
  personName.value = ''
  debtTitle.value = ''
  debtAmount.value = 0
  debtPaidAmount.value = 0
  debtDueDate.value = ''
  debtNotes.value = ''
  debtRecordToWallet.value = false
  debtWalletId.value = financeStore.wallets[0]?.id || null
  isFormSheetOpen.value = true
}

function openEditDebt(debt) {
  formError.value = ''
  editingDebtId.value = debt.id
  debtType.value = debt.type || 'payable'
  personName.value = debt.person_name || ''
  debtTitle.value = debt.title || ''
  debtAmount.value = Number(debt.amount || 0)
  debtPaidAmount.value = Number(debt.paid_amount || 0)
  debtDueDate.value = debt.due_date || ''
  debtNotes.value = debt.notes || ''
  debtRecordToWallet.value = false
  isFormSheetOpen.value = true
}

async function handleSaveDebt() {
  formError.value = ''
  if (!personName.value.trim() || !debtTitle.value.trim() || Number(debtAmount.value) <= 0) {
    formError.value = 'Nama pihak, keterangan, dan nominal wajib diisi.'
    return
  }
  const payload = {
    type: debtType.value,
    person_name: personName.value.trim(),
    title: debtTitle.value.trim(),
    amount: parseFloat(debtAmount.value),
    paid_amount: parseFloat(debtPaidAmount.value) || 0,
    due_date: debtDueDate.value || null,
    notes: debtNotes.value.trim() || null,
    record_to_wallet: !editingDebtId.value && debtRecordToWallet.value,
    wallet_id: !editingDebtId.value && debtRecordToWallet.value ? debtWalletId.value : null,
  }
  try {
    if (editingDebtId.value) {
      await financeStore.editDebt(editingDebtId.value, payload)
    } else {
      await financeStore.saveDebt(payload)
    }
    activeTab.value = debtType.value
    isFormSheetOpen.value = false
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan catatan hutang/piutang.'
  }
}

function openPayDebt(debt) {
  formError.value = ''
  selectedDebt.value = debt
  payAmount.value = getRemaining(debt)
  payRecordToWallet.value = true
  payWalletId.value = financeStore.wallets[0]?.id || null
  payNotes.value = ''
  isPaySheetOpen.value = true
}

async function handleConfirmPayDebt() {
  if (!selectedDebt.value) return
  formError.value = ''
  if (Number(payAmount.value) <= 0) {
    formError.value = 'Nominal pembayaran harus lebih dari Rp 0.'
    return
  }
  try {
    await financeStore.payDebt(selectedDebt.value.id, {
      amount: parseFloat(payAmount.value),
      record_to_wallet: payRecordToWallet.value,
      wallet_id: payRecordToWallet.value ? payWalletId.value : null,
      notes: payNotes.value.trim() || null,
    })
    isPaySheetOpen.value = false
    selectedDebt.value = null
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal mencatat pelunasan.'
  }
}

function openDeleteDebt(debt) {
  formError.value = ''
  selectedDebt.value = debt
  isDeleteSheetOpen.value = true
}

async function handleConfirmDelete() {
  if (!selectedDebt.value) return
  formError.value = ''
  try {
    await financeStore.removeDebt(selectedDebt.value.id)
    isDeleteSheetOpen.value = false
    selectedDebt.value = null
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menghapus catatan.'
  }
}
</script>

<template>
  <div class="space-y-4 md:space-y-5">
    <!-- Navigasi Kembali & Header -->
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
          <BaseHeading as="h2" size="xl" weight="semibold">Hutang & Piutang</BaseHeading>
          <BaseText size="sm" variant="muted" class="mt-0.5">
            Pantau kewajiban cicilan, pinjaman teman, dan piutang yang belum dilunasi.
          </BaseText>
        </div>

        <button
          type="button"
          @click="openCreateDebt"
          class="h-9 px-4 rounded-full flex items-center gap-1.5 bg-[#144229] hover:bg-[#1f5637] text-white dark:bg-[#a1d2af] dark:text-[#002110] text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <Plus class="w-4 h-4 stroke-[2.2]" />
          <span>Catat Baru</span>
        </button>
      </div>
    </div>

    <!-- 3 Metrics Card Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <BaseCard padding="p-4" class="space-y-1">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Sisa Hutang Saya
        </span>
        <div class="text-xl font-extrabold tabular-nums text-[#ba1a1a] dark:text-rose-400">
          {{ financeStore.formatMoney(totalPayable) }}
        </div>
      </BaseCard>

      <BaseCard padding="p-4" class="space-y-1">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Sisa Piutang (Hak)
        </span>
        <div class="text-xl font-extrabold tabular-nums text-[#144229] dark:text-[#a1d2af]">
          {{ financeStore.formatMoney(totalReceivable) }}
        </div>
      </BaseCard>

      <BaseCard padding="p-4" class="space-y-1">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Selisih Bersih (Net)
        </span>
        <div
          class="text-xl font-extrabold tabular-nums"
          :class="
            netDebtPosition < 0
              ? 'text-[#ba1a1a] dark:text-rose-400'
              : 'text-slate-900 dark:text-zinc-100'
          "
        >
          {{ financeStore.formatMoney(netDebtPosition, { withSign: true }) }}
        </div>
      </BaseCard>
    </div>

    <!-- Pill Tab Switcher (Mint & Charcoal Style) -->
    <div class="flex items-center gap-2 border-b border-[#e2e2e5] dark:border-zinc-800 pb-3">
      <button
        type="button"
        @click="activeTab = 'payable'"
        class="px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer"
        :class="
          activeTab === 'payable'
            ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-xs'
            : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-[#e2e2e5] dark:border-zinc-800'
        "
      >
        Hutang Saya ({{ financeStore.debts.filter((d) => d.type === 'payable').length }})
      </button>
      <button
        type="button"
        @click="activeTab = 'receivable'"
        class="px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer"
        :class="
          activeTab === 'receivable'
            ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-xs'
            : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-[#e2e2e5] dark:border-zinc-800'
        "
      >
        Piutang ({{ financeStore.debts.filter((d) => d.type === 'receivable').length }})
      </button>
    </div>

    <!-- Empty State -->
    <BaseCard
      v-if="filteredDebts.length === 0"
      padding="p-8"
      class="text-center"
    >
      <HandCash class="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
      <BaseHeading as="h3" size="md" weight="semibold">
        Belum ada catatan {{ activeTab === 'payable' ? 'hutang' : 'piutang' }}
      </BaseHeading>
      <BaseText size="xs" variant="muted" class="mt-1 max-w-sm mx-auto">
        Catat kewajiban pinjaman atau piutang agar jadwal jatuh tempo dan cicilan selalu terpantau.
      </BaseText>
      <div class="mt-4">
        <button
          type="button"
          @click="openCreateDebt"
          class="h-9 px-5 rounded-full bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        >
          + Catat {{ activeTab === 'payable' ? 'Hutang' : 'Piutang' }} Pertama
        </button>
      </div>
    </BaseCard>

    <!-- Daftar Hutang / Piutang -->
    <div v-else class="space-y-3">
      <BaseCard
        v-for="item in filteredDebts"
        :key="item.id"
        padding="p-4 sm:p-5"
        class="space-y-3"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {{ item.title }}
              </span>
              <BaseBadge
                :variant="item.status === 'paid' ? 'emerald' : item.status === 'partial' ? 'amber' : 'rose'"
                size="xs"
              >
                {{
                  item.status === 'paid'
                    ? '✓ Lunas'
                    : item.status === 'partial'
                      ? 'Cicilan Berjalan'
                      : 'Belum Lunas'
                }}
              </BaseBadge>
            </div>
            <p class="text-xs text-slate-500 dark:text-zinc-400">
              Pihak: <strong class="text-slate-700 dark:text-zinc-300">{{ item.person_name }}</strong>
            </p>
            <div class="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500">
              <Calendar class="w-3.5 h-3.5" />
              <span>Jatuh Tempo: {{ formatDate(item.due_date) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <div class="text-right mr-1">
              <div
                class="text-base font-extrabold tabular-nums"
                :class="
                  item.type === 'payable'
                    ? 'text-[#ba1a1a] dark:text-rose-400'
                    : 'text-[#144229] dark:text-[#a1d2af]'
                "
              >
                {{ financeStore.formatMoney(getRemaining(item)) }}
              </div>
              <span class="text-[10px] text-slate-400 dark:text-zinc-500 tabular-nums">
                Total: {{ financeStore.formatMoney(item.amount) }}
              </span>
            </div>

            <button
              v-if="item.status !== 'paid'"
              type="button"
              @click="openPayDebt(item)"
              class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
            >
              {{ item.type === 'payable' ? 'Bayar' : 'Terima' }}
            </button>

            <button
              type="button"
              @click="openEditDebt(item)"
              aria-label="Edit"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <EditPencil class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click="openDeleteDebt(item)"
              aria-label="Hapus"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#ba1a1a] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <Trash class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Progress Bar Pelunasan jika sudah dicicil -->
        <div v-if="Number(item.paid_amount) > 0" class="space-y-1 pt-2 border-t border-[#e2e2e5] dark:border-zinc-800">
          <div class="flex justify-between text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
            <span>Terbayar: {{ financeStore.formatMoney(item.paid_amount) }}</span>
            <span>{{ getProgress(item) }}% Lunas</span>
          </div>
          <div class="w-full h-1.5 rounded-full bg-[#f3f3f6] dark:bg-zinc-800 overflow-hidden">
            <div
              class="h-full rounded-full bg-[#144229] dark:bg-[#a1d2af] transition-all"
              :style="{ width: `${getProgress(item)}%` }"
            />
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- BottomSheet: Catat / Edit Hutang & Piutang -->
    <BottomSheet
      :show="isFormSheetOpen"
      :title="editingDebtId ? 'Edit Hutang / Piutang' : 'Catat Hutang / Piutang Baru'"
      @close="isFormSheetOpen = false"
    >
      <form @submit.prevent="handleSaveDebt" class="space-y-3.5 text-xs">
        <div
          v-if="formError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ formError }}
        </div>

        <!-- Jenis Switcher -->
        <div class="flex items-center gap-1 p-1 rounded-full bg-[#f3f3f6] dark:bg-zinc-800">
          <button
            type="button"
            @click="debtType = 'payable'"
            class="flex-1 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
            :class="
              debtType === 'payable'
                ? 'bg-[#ba1a1a] text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400'
            "
          >
            Hutang Saya (Wajib Bayar)
          </button>
          <button
            type="button"
            @click="debtType = 'receivable'"
            class="flex-1 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
            :class="
              debtType === 'receivable'
                ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-xs'
                : 'text-slate-600 dark:text-zinc-400'
            "
          >
            Piutang (Orang Berhutang)
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Nama Pihak / Lembaga
            </label>
            <input
              v-model="personName"
              type="text"
              required
              placeholder="Contoh: Budi, BCA, Kredivo..."
              class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-semibold text-slate-900 dark:text-zinc-100 outline-none"
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Judul / Keterangan
            </label>
            <input
              v-model="debtTitle"
              type="text"
              required
              placeholder="Contoh: Cicilan Laptop, Pinjaman..."
              class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-semibold text-slate-900 dark:text-zinc-100 outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Total Nominal (IDR)
            </label>
            <input
              v-model="debtAmount"
              type="number"
              min="1"
              required
              class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-extrabold text-sm tabular-nums text-slate-900 dark:text-zinc-100 outline-none"
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Tanggal Jatuh Tempo (Opsional)
            </label>
            <input
              v-model="debtDueDate"
              type="date"
              class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-semibold text-slate-900 dark:text-zinc-100 outline-none"
            />
          </div>
        </div>

        <!-- Opsi Catat ke Dompet saat membuat baru -->
        <div
          v-if="!editingDebtId"
          class="p-3 rounded-2xl bg-[#f9f9fc] dark:bg-zinc-800/50 border border-[#e2e2e5] dark:border-zinc-800 space-y-2.5"
        >
          <label class="flex items-center justify-between cursor-pointer">
            <div>
              <span class="font-bold text-slate-800 dark:text-zinc-200 block">
                Catat pencairan awal ke dompet
              </span>
              <span class="text-[11px] text-slate-400 dark:text-zinc-500">
                {{
                  debtType === 'payable'
                    ? 'Dana pinjaman masuk ke saldo dompet pilihan'
                    : 'Dana yang dipinjamkan keluar dari saldo dompet pilihan'
                }}
              </span>
            </div>
            <input
              type="checkbox"
              v-model="debtRecordToWallet"
              class="w-4 h-4 accent-[#144229] rounded cursor-pointer"
            />
          </label>

          <div v-if="debtRecordToWallet">
            <select
              v-model="debtWalletId"
              class="w-full p-2 rounded-xl bg-white dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-bold text-slate-800 dark:text-zinc-200 outline-none"
            >
              <option v-for="w in financeStore.wallets" :key="w.id" :value="w.id">
                {{ w.name }} ({{ financeStore.formatMoney(w.balance) }})
              </option>
            </select>
          </div>
        </div>

        <div class="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            @click="isFormSheetOpen = false"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="financeStore.isSaving"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {{ financeStore.isSaving ? 'Menyimpan...' : 'Simpan Catatan' }}
          </button>
        </div>
      </form>
    </BottomSheet>

    <!-- BottomSheet: Bayar Cicilan / Pelunasan Hutang & Piutang -->
    <BottomSheet
      :show="isPaySheetOpen"
      :title="selectedDebt?.type === 'payable' ? 'Bayar Hutang / Cicilan' : 'Terima Pembayaran Piutang'"
      @close="isPaySheetOpen = false"
    >
      <form v-if="selectedDebt" @submit.prevent="handleConfirmPayDebt" class="space-y-3.5 text-xs">
        <div class="p-3.5 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800/70 flex items-center justify-between">
          <div>
            <p class="font-bold text-slate-900 dark:text-zinc-100">{{ selectedDebt.title }}</p>
            <p class="text-[11px] text-slate-500 dark:text-zinc-400">
              Pihak: {{ selectedDebt.person_name }} · Sisa: {{ financeStore.formatMoney(getRemaining(selectedDebt)) }}
            </p>
          </div>
        </div>

        <div
          v-if="formError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ formError }}
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Nominal {{ selectedDebt.type === 'payable' ? 'Pembayaran' : 'Penerimaan' }} (IDR)
          </label>
          <input
            v-model="payAmount"
            type="number"
            min="1"
            :max="getRemaining(selectedDebt)"
            required
            class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-extrabold text-sm tabular-nums text-slate-900 dark:text-zinc-100 outline-none"
          />
        </div>

        <!-- Toggle Catat ke Dompet -->
        <div class="p-3 rounded-2xl bg-[#f9f9fc] dark:bg-zinc-800/50 border border-[#e2e2e5] dark:border-zinc-800 space-y-2.5">
          <label class="flex items-center justify-between cursor-pointer">
            <div>
              <span class="font-bold text-slate-800 dark:text-zinc-200 block">
                Catat transaksi ke saldo dompet
              </span>
              <span class="text-[11px] text-slate-400 dark:text-zinc-500">
                {{
                  selectedDebt.type === 'payable'
                    ? 'Otomatis mengurangi saldo dompet pembayar'
                    : 'Otomatis menambah saldo dompet penerima'
                }}
              </span>
            </div>
            <input
              type="checkbox"
              v-model="payRecordToWallet"
              class="w-4 h-4 accent-[#144229] rounded cursor-pointer"
            />
          </label>

          <div v-if="payRecordToWallet">
            <select
              v-model="payWalletId"
              class="w-full p-2 rounded-xl bg-white dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-bold text-slate-800 dark:text-zinc-200 outline-none"
            >
              <option v-for="w in financeStore.wallets" :key="w.id" :value="w.id">
                {{ w.name }} ({{ financeStore.formatMoney(w.balance) }})
              </option>
            </select>
          </div>
        </div>

        <div class="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            @click="isPaySheetOpen = false"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="financeStore.isSaving"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {{ financeStore.isSaving ? 'Memproses...' : 'Konfirmasi' }}
          </button>
        </div>
      </form>
    </BottomSheet>

    <!-- BottomSheet: Konfirmasi Hapus -->
    <BottomSheet
      :show="isDeleteSheetOpen"
      title="Hapus Catatan?"
      @close="isDeleteSheetOpen = false"
    >
      <div class="space-y-4 text-xs">
        <p class="text-slate-600 dark:text-zinc-400 leading-relaxed">
          Apakah kamu yakin ingin menghapus catatan
          <strong class="text-slate-900 dark:text-zinc-100">{{ selectedDebt?.title }}</strong>?
        </p>

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
