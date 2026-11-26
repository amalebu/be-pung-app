<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Trash, EditPencil, Wallet, Bank, CreditCard } from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import { useFinanceStore } from '@/stores/financeStore'

const financeStore = useFinanceStore()

const isFormSheetOpen = ref(false)
const isAdjustSheetOpen = ref(false)
const isDeleteSheetOpen = ref(false)
const selectedWallet = ref(null)
const formError = ref('')

const walletColors = [
  '#144229',
  '#2d5a3f',
  '#0f766e',
  '#1d4ed8',
  '#6d28d9',
  '#b45309',
  '#ba1a1a',
  '#373b3a',
]

// Add / Edit Wallet Form
const editingWalletId = ref(null)
const walletName = ref('')
const walletType = ref('cash')
const walletInitialBalance = ref(0)
const walletColor = ref('#144229')

// Adjust Balance Form
const targetBalance = ref(0)

onMounted(async () => {
  await financeStore.fetchWallets()
})

function getWalletTypeLabel(type) {
  if (type === 'cash') return 'Tunai / Kas Fisik'
  if (type === 'bank') return 'Rekening Bank'
  if (type === 'ewallet') return 'E-Wallet'
  if (type === 'credit') return 'Kartu Kredit'
  return type || 'Dompet'
}

function openAddSheet() {
  editingWalletId.value = null
  walletName.value = ''
  walletType.value = 'cash'
  walletInitialBalance.value = 0
  walletColor.value = '#144229'
  formError.value = ''
  isFormSheetOpen.value = true
}

function openEditSheet(wallet) {
  editingWalletId.value = wallet.id
  walletName.value = wallet.name || ''
  walletType.value = wallet.type || 'cash'
  walletInitialBalance.value = Number(wallet.initial_balance || 0)
  walletColor.value = wallet.color || '#144229'
  formError.value = ''
  isFormSheetOpen.value = true
}

async function handleSaveWallet() {
  formError.value = ''
  if (!walletName.value.trim()) {
    formError.value = 'Nama dompet wajib diisi.'
    return
  }
  try {
    if (editingWalletId.value) {
      await financeStore.editWallet(editingWalletId.value, {
        name: walletName.value.trim(),
        type: walletType.value,
        color: walletColor.value,
      })
    } else {
      await financeStore.saveWallet({
        name: walletName.value.trim(),
        type: walletType.value,
        initial_balance: parseFloat(walletInitialBalance.value) || 0,
        color: walletColor.value,
      })
    }
    isFormSheetOpen.value = false
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan dompet.'
  }
}

function openAdjustSheet(wallet) {
  selectedWallet.value = wallet
  targetBalance.value = Number(wallet.balance || 0)
  formError.value = ''
  isAdjustSheetOpen.value = true
}

async function handleAdjustBalance() {
  if (!selectedWallet.value) return
  formError.value = ''
  try {
    await financeStore.adjustWallet(selectedWallet.value.id, {
      target_balance: parseFloat(targetBalance.value) || 0,
    })
    isAdjustSheetOpen.value = false
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyesuaikan saldo.'
  }
}

function openDeleteSheet(wallet) {
  selectedWallet.value = wallet
  formError.value = ''
  isDeleteSheetOpen.value = true
}

async function handleConfirmDeleteWallet() {
  if (!selectedWallet.value) return
  formError.value = ''
  try {
    await financeStore.removeWallet(selectedWallet.value.id)
    isDeleteSheetOpen.value = false
    selectedWallet.value = null
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menonaktifkan dompet.'
  }
}
</script>

<template>
  <div class="space-y-4 md:space-y-5">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <BaseHeading as="h2" size="xl" weight="semibold">Dompet & Kartu</BaseHeading>
        <BaseText size="sm" variant="muted" class="mt-0.5">
          Kelola akun kas fisik, rekening bank, e-wallet, dan penyesuaian saldo.
        </BaseText>
      </div>
      <button
        type="button"
        @click="openAddSheet"
        class="h-9 px-4 rounded-full flex items-center gap-1.5 bg-[#144229] hover:bg-[#1f5637] text-white dark:bg-[#a1d2af] dark:text-[#002110] text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
      >
        <Plus class="w-4 h-4 stroke-[2.2]" />
        <span>Tambah Dompet</span>
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="financeStore.isLoading && financeStore.wallets.length === 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="h-36 rounded-2xl border border-[#e2e2e5] dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse"
      />
    </div>

    <!-- Empty State -->
    <BaseCard
      v-else-if="financeStore.wallets.length === 0"
      padding="p-8"
      class="text-center"
    >
      <Wallet class="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
      <BaseHeading as="h3" size="md" weight="semibold">Belum ada dompet aktif</BaseHeading>
      <BaseText size="xs" variant="muted" class="mt-1 max-w-sm mx-auto">
        Tambahkan dompet tunai, rekening bank, atau e-wallet untuk mulai mencatat arus kas harian.
      </BaseText>
      <div class="mt-4">
        <button
          type="button"
          @click="openAddSheet"
          class="h-9 px-5 rounded-full bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        >
          + Tambah Dompet Pertama
        </button>
      </div>
    </BaseCard>

    <!-- Wallets Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      <BaseCard
        v-for="wallet in financeStore.wallets"
        :key="wallet.id"
        padding="p-4 sm:p-5"
        class="space-y-3 flex flex-col justify-between"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <div
              class="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-2xs"
              :style="{ backgroundColor: wallet.color || '#144229' }"
            >
              <Bank v-if="wallet.type === 'bank'" class="w-4 h-4" />
              <CreditCard v-else-if="wallet.type === 'ewallet' || wallet.type === 'credit'" class="w-4 h-4" />
              <Wallet v-else class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <span class="font-bold text-sm text-slate-900 dark:text-zinc-100 block truncate">
                {{ wallet.name }}
              </span>
              <span class="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                {{ getWalletTypeLabel(wallet.type) }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <button
              type="button"
              @click="openEditSheet(wallet)"
              aria-label="Edit Dompet"
              title="Edit Dompet"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <EditPencil class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click="openDeleteSheet(wallet)"
              aria-label="Nonaktifkan Dompet"
              title="Nonaktifkan Dompet"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#ba1a1a] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <Trash class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div class="pt-2.5 border-t border-[#e2e2e5] dark:border-zinc-800 space-y-1">
          <div class="flex items-baseline justify-between text-xs tabular-nums">
            <span class="text-slate-400 dark:text-zinc-500 text-[11px]">
              Saldo Awal: {{ financeStore.formatMoney(wallet.initial_balance) }}
            </span>
          </div>
          <div class="text-lg font-extrabold text-slate-900 dark:text-zinc-100 tabular-nums">
            {{ financeStore.formatMoney(wallet.balance) }}
          </div>
        </div>

        <button
          type="button"
          @click="openAdjustSheet(wallet)"
          class="w-full py-2 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800/80 border border-[#e2e2e5] dark:border-zinc-700 hover:bg-[#d3e4d8]/45 hover:text-[#144229] dark:hover:bg-zinc-800 dark:hover:text-[#a1d2af] transition-colors text-slate-700 dark:text-zinc-300 cursor-pointer"
        >
          Sesuaikan Saldo
        </button>
      </BaseCard>
    </div>

    <!-- BottomSheet: Tambah / Edit Dompet -->
    <BottomSheet
      :show="isFormSheetOpen"
      :title="editingWalletId ? 'Edit Dompet' : 'Tambah Dompet Baru'"
      @close="isFormSheetOpen = false"
    >
      <form @submit.prevent="handleSaveWallet" class="space-y-3.5 text-xs">
        <div
          v-if="formError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ formError }}
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Nama Dompet
          </label>
          <input
            type="text"
            v-model="walletName"
            placeholder="Contoh: BCA Utama, GoPay, Tunai..."
            required
            class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-semibold text-slate-900 dark:text-zinc-100 outline-none"
          />
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Tipe Akun
          </label>
          <select
            v-model="walletType"
            class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-semibold text-slate-900 dark:text-zinc-100 outline-none"
          >
            <option value="cash">Tunai / Kas Fisik</option>
            <option value="bank">Rekening Bank</option>
            <option value="ewallet">E-Wallet</option>
            <option value="credit">Kartu Kredit</option>
          </select>
        </div>

        <div v-if="!editingWalletId">
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Saldo Awal (IDR)
          </label>
          <input
            type="number"
            v-model="walletInitialBalance"
            placeholder="0"
            class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-extrabold text-sm tabular-nums text-slate-900 dark:text-zinc-100 outline-none"
          />
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
            Warna Aksen Dompet
          </label>
          <div class="flex items-center gap-2 flex-wrap">
            <button
              v-for="c in walletColors"
              :key="c"
              type="button"
              @click="walletColor = c"
              class="w-7 h-7 rounded-full border-2 transition-transform cursor-pointer"
              :class="walletColor === c ? 'scale-110 border-slate-900 dark:border-white' : 'border-transparent'"
              :style="{ backgroundColor: c }"
            />
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
            {{ financeStore.isSaving ? 'Menyimpan...' : 'Simpan Dompet' }}
          </button>
        </div>
      </form>
    </BottomSheet>

    <!-- BottomSheet: Sesuaikan Saldo Langsung -->
    <BottomSheet
      :show="isAdjustSheetOpen"
      :title="`Sesuaikan Saldo · ${selectedWallet?.name || ''}`"
      @close="isAdjustSheetOpen = false"
    >
      <form @submit.prevent="handleAdjustBalance" class="space-y-3.5 text-xs">
        <div
          v-if="formError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ formError }}
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Saldo Riil Baru (IDR)
          </label>
          <input
            type="number"
            v-model="targetBalance"
            required
            class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-extrabold text-base tabular-nums text-slate-900 dark:text-zinc-100 outline-none"
          />
        </div>

        <p class="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
          Perubahan saldo ini akan langsung menyinkronkan saldo dompet ke jumlah riil terbaru tanpa membuat catatan transaksi baru di daftar riwayat.
        </p>

        <div class="flex items-center gap-2.5 pt-2">
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
            {{ financeStore.isSaving ? 'Menyimpan...' : 'Simpan Saldo' }}
          </button>
        </div>
      </form>
    </BottomSheet>

    <!-- BottomSheet: Konfirmasi Nonaktifkan Dompet -->
    <BottomSheet
      :show="isDeleteSheetOpen"
      title="Nonaktifkan Dompet?"
      @close="isDeleteSheetOpen = false"
    >
      <div class="space-y-4 text-xs">
        <p class="text-slate-600 dark:text-zinc-400 leading-relaxed">
          Dompet <strong class="text-slate-900 dark:text-zinc-100">{{ selectedWallet?.name }}</strong> akan dinonaktifkan dari daftar aktif. Seluruh riwayat transaksi yang pernah menggunakan dompet ini tetap tersimpan utuh.
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
            @click="handleConfirmDeleteWallet"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#ba1a1a] text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {{ financeStore.isSaving ? 'Memproses...' : 'Ya, Nonaktifkan' }}
          </button>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>
