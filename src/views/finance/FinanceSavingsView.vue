<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  PiggyBank,
  Plus,
  EditPencil,
  Trash,
  NavArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
} from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import { useFinanceStore } from '@/stores/financeStore'

const router = useRouter()
const financeStore = useFinanceStore()

const isGoalSheetOpen = ref(false)
const isAdjustSheetOpen = ref(false)
const isDeleteSheetOpen = ref(false)
const selectedGoal = ref(null)
const formError = ref('')

// Goal Form
const editingGoalId = ref(null)
const goalName = ref('')
const goalTargetAmount = ref(0)
const goalCurrentAmount = ref(0)
const goalTargetDate = ref('')
const goalNotes = ref('')

// Adjust Form (Deposit / Withdraw)
const adjustAction = ref('deposit') // deposit | withdraw
const adjustAmount = ref(0)
const adjustRecordToWallet = ref(true)
const adjustWalletId = ref(null)
const adjustNotes = ref('')

onMounted(async () => {
  await Promise.all([
    financeStore.fetchSavingsGoals(),
    financeStore.fetchWallets(),
  ])
  if (financeStore.wallets.length > 0) {
    adjustWalletId.value = financeStore.wallets[0].id
  }
})

const totalSaved = computed(() =>
  financeStore.savingsGoals.reduce((acc, g) => acc + Number(g.current_amount || 0), 0)
)
const totalTarget = computed(() =>
  financeStore.savingsGoals.reduce((acc, g) => acc + Number(g.target_amount || 0), 0)
)
const overallPercentage = computed(() => {
  if (!totalTarget.value) return 0
  return Math.min(100, Math.round((totalSaved.value / totalTarget.value) * 100))
})

function getPercentage(goal) {
  const target = Number(goal.target_amount || 0)
  if (!target) return 0
  return Math.min(100, Math.round((Number(goal.current_amount || 0) / target) * 100))
}

function formatDate(dateStr) {
  if (!dateStr) return 'Tanpa tenggat'
  const d = new Date(`${dateStr}T00:00:00`)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function openCreateGoal() {
  formError.value = ''
  editingGoalId.value = null
  goalName.value = ''
  goalTargetAmount.value = 0
  goalCurrentAmount.value = 0
  goalTargetDate.value = ''
  goalNotes.value = ''
  isGoalSheetOpen.value = true
}

function openEditGoal(goal) {
  formError.value = ''
  editingGoalId.value = goal.id
  goalName.value = goal.name || ''
  goalTargetAmount.value = Number(goal.target_amount || 0)
  goalCurrentAmount.value = Number(goal.current_amount || 0)
  goalTargetDate.value = goal.target_date || ''
  goalNotes.value = goal.notes || ''
  isGoalSheetOpen.value = true
}

async function handleSaveGoal() {
  formError.value = ''
  if (!goalName.value.trim() || Number(goalTargetAmount.value) <= 0) {
    formError.value = 'Nama tabungan dan target dana harus diisi.'
    return
  }
  const payload = {
    name: goalName.value.trim(),
    target_amount: parseFloat(goalTargetAmount.value),
    current_amount: parseFloat(goalCurrentAmount.value) || 0,
    target_date: goalTargetDate.value || null,
    notes: goalNotes.value.trim() || null,
  }
  try {
    if (editingGoalId.value) {
      await financeStore.editSavingsGoal(editingGoalId.value, payload)
    } else {
      await financeStore.saveSavingsGoal(payload)
    }
    isGoalSheetOpen.value = false
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan target tabungan.'
  }
}

function openAdjustGoal(goal, action = 'deposit') {
  formError.value = ''
  selectedGoal.value = goal
  adjustAction.value = action
  adjustAmount.value = 0
  adjustRecordToWallet.value = true
  adjustWalletId.value = financeStore.wallets[0]?.id || null
  adjustNotes.value = ''
  isAdjustSheetOpen.value = true
}

async function handleConfirmAdjust() {
  if (!selectedGoal.value) return
  formError.value = ''
  if (Number(adjustAmount.value) <= 0) {
    formError.value = 'Masukkan nominal lebih dari Rp 0.'
    return
  }
  try {
    await financeStore.adjustSavingsGoal(selectedGoal.value.id, {
      action: adjustAction.value,
      amount: parseFloat(adjustAmount.value),
      record_to_wallet: adjustRecordToWallet.value,
      wallet_id: adjustRecordToWallet.value ? adjustWalletId.value : null,
      notes: adjustNotes.value.trim() || null,
    })
    isAdjustSheetOpen.value = false
    selectedGoal.value = null
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal memperbarui saldo tabungan.'
  }
}

function openDeleteGoal(goal) {
  formError.value = ''
  selectedGoal.value = goal
  isDeleteSheetOpen.value = true
}

async function handleConfirmDelete() {
  if (!selectedGoal.value) return
  formError.value = ''
  try {
    await financeStore.removeSavingsGoal(selectedGoal.value.id)
    isDeleteSheetOpen.value = false
    selectedGoal.value = null
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menghapus target tabungan.'
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
          <BaseHeading as="h2" size="xl" weight="semibold">Tabungan & Target Dana</BaseHeading>
          <BaseText size="sm" variant="muted" class="mt-0.5">
            Kelola progres celengan masa depan, dana darurat, dan pencapaian target finansialmu.
          </BaseText>
        </div>

        <button
          type="button"
          @click="openCreateGoal"
          class="h-9 px-4 rounded-full flex items-center gap-1.5 bg-[#144229] hover:bg-[#1f5637] text-white dark:bg-[#a1d2af] dark:text-[#002110] text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <Plus class="w-4 h-4 stroke-[2.2]" />
          <span>Target Baru</span>
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <BaseCard padding="p-4" class="space-y-1">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Total Dana Terkumpul
        </span>
        <div class="text-xl font-extrabold tabular-nums text-[#144229] dark:text-[#a1d2af]">
          {{ financeStore.formatMoney(totalSaved) }}
        </div>
      </BaseCard>

      <BaseCard padding="p-4" class="space-y-1">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Total Target Keseluruhan
        </span>
        <div class="text-xl font-extrabold tabular-nums text-slate-900 dark:text-zinc-100">
          {{ financeStore.formatMoney(totalTarget) }}
        </div>
      </BaseCard>

      <BaseCard padding="p-4" class="space-y-1">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Pencapaian Keseluruhan
        </span>
        <div class="text-xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
          {{ overallPercentage }}%
        </div>
      </BaseCard>
    </div>

    <!-- Empty State -->
    <BaseCard
      v-if="financeStore.savingsGoals.length === 0"
      padding="p-8"
      class="text-center"
    >
      <PiggyBank class="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
      <BaseHeading as="h3" size="md" weight="semibold">Belum ada target tabungan</BaseHeading>
      <BaseText size="xs" variant="muted" class="mt-1 max-w-sm mx-auto">
        Mulai buat target Dana Darurat, Liburan, atau Investasi dan pantau progres setoran rutinmu.
      </BaseText>
      <div class="mt-4">
        <button
          type="button"
          @click="openCreateGoal"
          class="h-9 px-5 rounded-full bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        >
          + Buat Target Tabungan Pertama
        </button>
      </div>
    </BaseCard>

    <!-- Daftar Target Tabungan -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      <BaseCard
        v-for="goal in financeStore.savingsGoals"
        :key="goal.id"
        padding="p-4 sm:p-5"
        class="space-y-3.5 flex flex-col justify-between"
      >
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-10 h-10 rounded-2xl bg-[#d3e4d8]/50 dark:bg-[#144229]/50 text-[#144229] dark:text-[#a1d2af] flex items-center justify-center shrink-0"
              >
                <PiggyBank class="w-5 h-5 stroke-[2]" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                    {{ goal.name }}
                  </h3>
                  <BaseBadge v-if="goal.is_completed" variant="emerald" size="xs">Tercapai</BaseBadge>
                </div>
                <p class="text-[11px] text-slate-400 dark:text-zinc-500">
                  Target: {{ formatDate(goal.target_date) }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                @click="openEditGoal(goal)"
                aria-label="Edit Target"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <EditPencil class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="openDeleteGoal(goal)"
                aria-label="Hapus Target"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#ba1a1a] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <Trash class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-baseline justify-between text-xs tabular-nums">
              <span class="font-extrabold text-slate-900 dark:text-zinc-100">
                {{ financeStore.formatMoney(goal.current_amount) }}
              </span>
              <span class="text-slate-400 dark:text-zinc-500">
                dari {{ financeStore.formatMoney(goal.target_amount) }} ({{ getPercentage(goal) }}%)
              </span>
            </div>

            <div class="w-full h-2.5 rounded-full bg-[#f3f3f6] dark:bg-zinc-800 overflow-hidden">
              <div
                class="h-full rounded-full bg-[#144229] dark:bg-[#a1d2af] transition-all"
                :style="{ width: `${getPercentage(goal)}%` }"
              />
            </div>

            <div class="flex justify-between text-[11px] text-slate-400 dark:text-zinc-500 tabular-nums">
              <span>
                Kekurangan: {{ financeStore.formatMoney(Math.max(0, goal.target_amount - goal.current_amount)) }}
              </span>
              <span v-if="goal.notes" class="truncate max-w-[180px]">{{ goal.notes }}</span>
            </div>
          </div>
        </div>

        <!-- Tombol Setor & Tarik -->
        <div class="pt-2.5 border-t border-[#e2e2e5] dark:border-zinc-800 flex items-center gap-2">
          <button
            type="button"
            @click="openAdjustGoal(goal, 'deposit')"
            class="flex-1 py-2 rounded-full text-xs font-bold bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
          >
            <ArrowUpRight class="w-3.5 h-3.5 stroke-[2.3]" />
            <span>Setor Dana</span>
          </button>
          <button
            type="button"
            @click="openAdjustGoal(goal, 'withdraw')"
            class="px-4 py-2 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
          >
            <ArrowDownRight class="w-3.5 h-3.5 stroke-[2.3]" />
            <span>Tarik</span>
          </button>
        </div>
      </BaseCard>
    </div>

    <!-- BottomSheet: Buat / Edit Target Tabungan -->
    <BottomSheet
      :show="isGoalSheetOpen"
      :title="editingGoalId ? 'Edit Target Tabungan' : 'Buat Target Tabungan Baru'"
      @close="isGoalSheetOpen = false"
    >
      <form @submit.prevent="handleSaveGoal" class="space-y-3.5 text-xs">
        <div
          v-if="formError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ formError }}
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Nama Target Tabungan
          </label>
          <input
            v-model="goalName"
            type="text"
            required
            placeholder="Contoh: Dana Darurat, Liburan Jepang..."
            class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-semibold text-slate-900 dark:text-zinc-100 outline-none"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Target Nominal (IDR)
            </label>
            <input
              v-model="goalTargetAmount"
              type="number"
              min="1"
              required
              class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-extrabold text-sm tabular-nums text-slate-900 dark:text-zinc-100 outline-none"
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Dana Terkumpul Saat Ini (IDR)
            </label>
            <input
              v-model="goalCurrentAmount"
              type="number"
              min="0"
              class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-extrabold text-sm tabular-nums text-slate-900 dark:text-zinc-100 outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Target Tanggal Tercapai (Opsional)
            </label>
            <input
              v-model="goalTargetDate"
              type="date"
              class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-semibold text-slate-900 dark:text-zinc-100 outline-none"
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Catatan Singkat (Opsional)
            </label>
            <input
              v-model="goalNotes"
              type="text"
              placeholder="Misal: Rekening terpisah..."
              class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-semibold text-slate-900 dark:text-zinc-100 outline-none"
            />
          </div>
        </div>

        <div class="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            @click="isGoalSheetOpen = false"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="financeStore.isSaving"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {{ financeStore.isSaving ? 'Menyimpan...' : 'Simpan Target' }}
          </button>
        </div>
      </form>
    </BottomSheet>

    <!-- BottomSheet: Setor / Tarik Tabungan (+ Integrasi Dompet Opsional) -->
    <BottomSheet
      :show="isAdjustSheetOpen"
      :title="`${adjustAction === 'deposit' ? 'Setor ke' : 'Tarik dari'} ${selectedGoal?.name || 'Tabungan'}`"
      @close="isAdjustSheetOpen = false"
    >
      <form @submit.prevent="handleConfirmAdjust" class="space-y-3.5 text-xs">
        <div
          v-if="formError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ formError }}
        </div>

        <!-- Mode Switcher -->
        <div class="flex items-center gap-1 p-1 rounded-full bg-[#f3f3f6] dark:bg-zinc-800">
          <button
            type="button"
            @click="adjustAction = 'deposit'"
            class="flex-1 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
            :class="
              adjustAction === 'deposit'
                ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-xs'
                : 'text-slate-600 dark:text-zinc-400'
            "
          >
            + Setor Tabungan
          </button>
          <button
            type="button"
            @click="adjustAction = 'withdraw'"
            class="flex-1 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
            :class="
              adjustAction === 'withdraw'
                ? 'bg-[#ba1a1a] text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400'
            "
          >
            − Tarik Dana
          </button>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Nominal {{ adjustAction === 'deposit' ? 'Setoran' : 'Penarikan' }} (IDR)
          </label>
          <input
            v-model="adjustAmount"
            type="number"
            min="1"
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
                  adjustAction === 'deposit'
                    ? 'Otomatis memotong saldo dompet sumber yang dipilih'
                    : 'Otomatis menambah saldo dompet tujuan yang dipilih'
                }}
              </span>
            </div>
            <input
              type="checkbox"
              v-model="adjustRecordToWallet"
              class="w-4 h-4 accent-[#144229] rounded cursor-pointer"
            />
          </label>

          <div v-if="adjustRecordToWallet">
            <label class="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 mb-1">
              Pilih Dompet
            </label>
            <select
              v-model="adjustWalletId"
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
            @click="isAdjustSheetOpen = false"
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
      title="Hapus Target Tabungan?"
      @close="isDeleteSheetOpen = false"
    >
      <div class="space-y-4 text-xs">
        <p class="text-slate-600 dark:text-zinc-400 leading-relaxed">
          Apakah kamu yakin ingin menghapus target tabungan
          <strong class="text-slate-900 dark:text-zinc-100">{{ selectedGoal?.name }}</strong>?
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
